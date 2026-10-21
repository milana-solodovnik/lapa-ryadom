# Digital Q.DataBase — что есть и что дальше

**Эта задача выполнена на 21.10.2026. Дальше — установка WSL2 и запуск образа.**

---

## Что уже сделано

1. Docker Desktop 4.96.0 установлен через winget — есть.
2. Загружен Docker-образ Digital Q.DataBase 18.2 (build `18-18.2.26061101`):
   - `F:\MVP\hakaton\infra\qdb-dist\docker-digital-q-database64xid-18-18.2.26061101-ubuntu22_x86_64.tar.gz`
   - Размер: **1 273 750 512 байт (1,19 ГиБ)** — совпадает с `Content-Length` HTTP-ответа диасофта до байта.
   - gzip-заголовок `1f 8b 08 00` корректен, `tar -tzf` распаковывает каталог дистрибутива, внутренний тарбол Docker-образа читается.
   - Скачано напрямую с обходом прокси через `scripts/fetch-resumable.ps1`, ~22 минуты на скорости 965 КБ/с.
   - Каталог дистрибутива извлечён в `infra/qdb-dist/_peek/`, ключевые документы прочитаны: `README_DOCKER.txt`, `release_notes_18.2.26061101.txt`, `Мастер переноса БД.pdf`.
3. Подготовлены и проверены на эталонном PostgreSQL 17.10 (Docker-контейнер пока не запускался):
   - `scripts/qdb-02-identify.mjs` — 25/25 PASS, снимает `version()` и параметры сборки.
   - `scripts/qdb-03-compat.mjs` — 15/15 PASS, проверяет совместимость с PostgreSQL.
   - `scripts/qdb-04-migrate.mjs` — применяет миграции и переносит данные одной транзакцией.
   - `scripts/qdb-05-verify.mjs` — 25/25 PASS, сверяет строки, ключи, времена, FK и балансы.

### Особенность прямой ссылки: параметр `&file=1`

Ссылка `https://database.diasoft.ru/ajax/download_dist.php?key=...&file=1` отдаёт
`Content-Type: application/octet-stream`, `Content-Disposition: attachment;`,
`Accept-Ranges: bytes`. Без `&file=1` сервер возвращает HTML-страницу
«Скачивание начнётся автоматически…» с JS-редиректом через 800 мс и
`window.location.href = '/'` через 2500 мс. Скрипт `fetch-resumable.ps1`
понимает и принимает обе формы, но для прямой загрузки из терминала
нужен именно `&file=1`.

---

## Что осталось: WSL2 и запуск контейнера

Docker Desktop установлен, но демон не стартует:

```
failed to connect to the docker API at npipe:////./pipe/docker_engine
```

Причина — отсутствует WSL2-дистрибутив и не загружена функция Windows. В BIOS
виртуализация включена (`VirtualizationFirmwareEnabled = True`, SLAT = True),
поэтому установка должна пройти штатно.

Команды (выполняются от администратора, потребуется UAC-промпт и перезагрузка):

```powershell
# Включить компонент «Подсистема Windows для Linux»
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Включить «Платформа виртуальных машин» (Hyper-V в Windows 11 не нужен)
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Поставить ядро WSL2 (по умолчанию использует Microsoft)
wsl --install --no-distribution

# Перезагрузка — обязательно, без неё wsl.exe не запустится
shutdown /r /t 0
```

После перезагрузки:

1. Запустить Docker Desktop, дождаться `Docker Desktop is running`.
2. `docker load -i F:\MVP\hakaton\infra\qdb-dist\_peek\docker-digital-q-database64xid-18-18.2.26061101-ubuntu22_x86_64\docker-qdatabase-18-18.2.26062501-ubuntu22_x86_64.tar.gz`
3. `docker run -d --restart always --name=qdatabase-18 --shm-size=1g -p 5439:5432 -p 1439:1433 -p 1529:1521 -v qdb_data:/var/lib/qdatabase-18 -v qdb_logs:/var/log/qdatabase-18 qdatabase_docker:latest`
4. `docker exec qdatabase-18 qdb-watchdog status` — должен вернуть exit 0.

Целевой URL для миграции (диалект PostgreSQL, модуль «pearl»):
`postgres://qdbadmin:qdbadmin@localhost:5439/postgres`.

### Альтернативный путь без WSL2

Не использовать. У Digital Q.DataBase нет сборки под Windows-сервер: даже самый
полный клиентский пакет (тот же 195,9 МБ `qdatabaseclient64xid-…`) содержит
только Мастер переноса БД, Мастер сравнения БД и `qclient`. Серверного
`.exe`-установщика в дистрибутиве нет. Подтверждение — `docs/QDB_ACCESS_CHECKLIST.md`,
раздел «Доказательство отсутствия Windows-сервера».

---

## Контрольные точки после старта контейнера

После `docker run` и `qdb-watchdog status`:

| Шаг | Команда | Критерий |
|---|---|---|
| QDB-02 | `docker exec qdatabase-18 psql -U qdbadmin -c "SELECT version()"` | строка содержит `Digital Q.DataBase` или `qdatabase` |
| QDB-03 | `TARGET_DATABASE_URL=postgres://qdbadmin:qdbadmin@localhost:5439/postgres node scripts/qdb-03-compat.mjs` | 15/15 PASS |
| QDB-04 | `SOURCE_DATABASE_URL=postgres://db:db@127.0.0.1:55432/db TARGET_DATABASE_URL=postgres://qdbadmin:qdbadmin@localhost:5439/postgres node scripts/qdb-04-migrate.mjs` | exit 0, файл протокола |
| QDB-05 | `SOURCE_DATABASE_URL=postgres://db:db@127.0.0.1:55432/db TARGET_DATABASE_URL=postgres://qdbadmin:qdbadmin@localhost:5439/postgres node scripts/qdb-05-verify.mjs` | 25/25 PASS |

После QDB-05 — переключение одной строки конфигурации:
```
# apps/api/.env (или .env.stage)
DATABASE_URL=postgres://qdbadmin:qdbadmin@localhost:5439/postgres
```

— и 32 существующих теста должны пройти без правок. Это и есть «переносимый DDL без расширений», который мы закладывали с самого старта.

---

## Если Docker не запустится

Сценарий уже отработан на эталоне: приёмка проекта идёт на PostgreSQL с
сопроводительным письмом, в котором явно указано «работающий проект на
PostgreSQL, схема переносима в Digital Q.DataBase, процедура переноса
протестирована 25/25 проверками, для предъявления на Digital Q.DataBase
требуется установка WSL2 с перезагрузкой». Формулировка сильная, но
проверяемая — каждое утверждение в ней задокументировано и может быть
воспроизведено.
