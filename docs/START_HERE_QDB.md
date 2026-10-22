# Digital Q.DataBase — как поднять и как проверить

**Статус на 22.10.2026: задача выполнена.** Реальный экземпляр Digital Q.DataBase 18.2
поднят, данные перенесены, сверка пройдена. Ниже — точная инструкция воспроизведения.

---

## Что реально работает сейчас

| Что | Значение |
|---|---|
| Контейнер | `qdatabase-18`, состояние `healthy`, все 3 диалекта `ready=true` |
| Подключение (pearl) | `postgres://qdbadmin:qdbadmin@127.0.0.1:15432/postgres` |
| Версия | `PostgreSQL 18.2 on x86_64-pc-linux-gnu` |
| Доказательство, что это QDB | `qdb_procs=4`, `qdb_settings=20`, `dgrid_procs=15` |
| Перенос | 3 приюта, 4 аккаунта, 10 потребностей, 4 предложения, 1 доставка |
| Сверка | **25/25 PASS**, `VERDICT: MIGRATION VERIFIED` |
| Тесты приложения на QDB | **60/60 PASS** |

---

## Поднятие с нуля

### 1. WSL2

Docker Desktop без WSL2 не стартует. Компоненты включаются один раз, затем **обязательна
перезагрузка**:

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
wsl --install --no-distribution
shutdown /r /t 0
```

### 2. `.wslconfig` — обязателен из-за лицензии

QDB-лицензия допускает **4 ядра**. Без этого ограничения QDB отказывается стартовать
диалекты.

```ini
[wsl2]
processors=4
memory=8GB
swap=4GB
localhostForwarding=true

[experimental]
autoMemoryReclaim=gradual
sparseVhd=true
```

Файл: `C:\Users\Home\.wslconfig`. После правки — `wsl --shutdown`, затем снова запустить Docker.

> **Две ловушки, которые стоили времени.**
> Ключ **`cpus` не распознаётся** WSL2 — молча остаётся 16 vCPU, и лицензия QDB падает.
> Нужен именно `processors`.
> Флаги Docker `--cpus=4` и `--cpuset-cpus=0-3` **тоже не помогают**: лицензионная проверка
> считает физические ядра по `core id` в `/proc/cpuinfo`, а не по `sched_getaffinity`.
> Только `processors` в `.wslconfig` реально снижает число ядер, видимое контейнеру.

### 3. Образ и контейнер

```powershell
docker load -i F:\MVP\hakaton\infra\qdb-dist\_peek\docker-digital-q-database64xid-18-18.2.26061101-ubuntu22_x86_64\docker-qdatabase-18-18.2.26062501-ubuntu22_x86_64.tar.gz

docker run -d --restart always --name=qdatabase-18 --shm-size=1g `
  -p 15432:5432 -p 15445:5445 -p 15444:5444 `
  -v qdb_data:/var/lib/qdatabase-18 `
  -v qdb_logs:/var/log/qdatabase-18 `
  qdatabase_docker:latest
```

> **Внутренние порты в `README_DOCKER.txt` дистрибутива указаны неверно.**
> Реально: `pearl=5432`, `marble=5445`, `onyx=5444` — а не `5432/1433/1521`.
> Отсюда и проброс `15432/15445/15444`, а не `5439/1439/1529`.

### 4. Роль и сетевой доступ

По умолчанию QDB слушает только localhost, а роль `postgres` — единственная. Нужны два
скрипта из репозитория:

```powershell
docker cp F:\MVP\hakaton\scripts\qdb-listen-all.sh qdatabase-18:/tmp/
docker exec qdatabase-18 sh /tmp/qdb-listen-all.sh     # listen_addresses='*' + pg_hba trust
docker exec qdatabase-18 sh /tmp/qdb-create-roles.sh   # CREATE ROLE qdbadmin LOGIN SUPERUSER
docker restart qdatabase-18
```

---

## Встроенная dev-БД переехала на порт 55850

Эталонный PostgreSQL поднимается через `embedded-postgres` на **55850**, а не на 55432.
После активации WSL2 Windows резервирует диапазон `netsh excludedportrange` (`55220..55719`),
и bind на 55432 падает с `WSAEACCES`. 55850 свободен.

```powershell
pwsh -NoProfile -File F:\MVP\hakaton\scripts\start-pg-detached.ps1
# [db:up] ready at 127.0.0.1:55850
```

---

## Проверки

```powershell
# Доказательство, что это Digital Q.DataBase, а не ванильный PostgreSQL
$env:TARGET_DATABASE_URL='postgres://qdbadmin:qdbadmin@127.0.0.1:15432/postgres'
node scripts/qdb-02b-prove.mjs

# 15 проб совместимости
node scripts/qdb-03-compat.mjs

# Перенос одной транзакцией
$env:SOURCE_DATABASE_URL='postgres://db:db@127.0.0.1:55850/db'
node scripts/qdb-04-migrate.mjs

# 25 проверок сверки
node scripts/qdb-05-verify.mjs

# Приложение целиком на QDB
cd apps\api
$env:TEST_DATABASE_URL='postgres://qdbadmin:qdbadmin@127.0.0.1:15432/postgres'
npx vitest run
```

---

## Особенности QDB, на которые наступили

Их две, и обе учтены в коде:

1. **QDB хранит миллисекунды, PostgreSQL — микросекунды.** При чтении TIMESTAMPTZ нужен
   `date_trunc('milliseconds', col)`, иначе `EXTRACT(EPOCH)` расходится на микросекунды.
2. **Ошибка UNIQUE приходит по-русски.** Английский regex `/duplicate key|unique/i` не
   срабатывает. Надёжно ловить по `err.code === '23505'`.

Несовместимостей, требующих правки приложения, не обнаружено: `db/migrations/*.sql`
применились на QDB без единой изменения.

Единственный провал тестов на QDB оказался **нашим багом**, а не особенностью QDB —
см. сессию 8 в `docs/IMPLEMENTATION_STATUS.md`.

---

## Если нужно поднять заново на другом компьютере

Единственный серверный пакет Digital Q.DataBase — это Docker; сборки под Windows-сервер
в дистрибутиве нет. Подтверждение — `docs/QDB_ACCESS_CHECKLIST.md`, раздел «Доказательство
отсутствия Windows-сервера». Поэтому порядок «WSL2 → Docker → образ» обязателен.