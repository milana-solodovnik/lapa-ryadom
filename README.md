# «Лапа рядом»

Сервис адресной вещевой помощи приютам для животных. Посетитель без регистрации
выбирает потребность приюта, называет посильное количество и получает
одноразовый секретный код. Представитель приюта подтверждает фактическую
передачу, и система пересчитывает четыре счётчика:

**требуется · обещано · получено · свободно**

Ключевая идея — различать обещанное и полученное. Пять обещанных упаковок и три
привезённые — это разные числа, и база не даёт им слиться.

Проект участвует в конкурсе [Digital Q.DataBase 2026](https://dbd.diasoft.ru/)
(день СУБД, 27 октября 2026, Москва).

## Перенос на Digital Q.DataBase

Исходная база — PostgreSQL. Проект перенесён на **Digital Q.DataBase 18.2**
**без единой правки в коде и в схеме**. Проверено реальными прогонами:

| Проверка | Результат | Чем сделано |
|---|---|---|
| Сверка переноса данных | **25 / 25** | `scripts/qdb-05-verify.mjs` |
| Тесты приложения на целевой базе | **60 / 60** | `vitest run` на Q.DataBase |
| Работа по протоколу Microsoft SQL (T-SQL) | **9 / 9** | `scripts/qdb-mssql-check.ps1` |

Та же самая база отвечает ещё и по протоколу Microsoft SQL и понимает T-SQL:
`CREATE TABLE`, `IDENTITY`, `CONSTRAINT`, `ISNULL`, `TOP`. Ограничения не
просто принимаются, а реально работают — дубль в первичном ключе база
отвергает. Русские названия возвращаются без искажений.

Подробности: [`docs/START_HERE_QDB.md`](docs/START_HERE_QDB.md),
[`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md).

## Стек

| Слой | Технология |
|---|---|
| Веб | React 18 + TypeScript + Vite + React Router (CSS Modules) |
| API | Node.js 24 LTS + TypeScript + Fastify + Zod |
| БД (разработка) | PostgreSQL 16, встроенный `embedded-postgres` — без установки в систему |
| БД (целевая) | Digital Q.DataBase 18.2 |
| Авторизация сотрудников | Argon2id + cookie-сессии в таблице `auth_sessions` |
| Тесты | Vitest (unit + integration + concurrency) |

## Быстрый старт (Windows / PowerShell)

```powershell
# 1. Зависимости (root, через workspaces)
npm install

# 2. Поднять локальный PostgreSQL (встроенный, не требует установки в систему)
npm run db:up

# 3. Применить миграции и загрузить демоданные
npm run db:migrate
npm run db:seed

# 4. Запустить API и Web параллельно
npm run dev
```

Web: `http://localhost:5173`. API: `http://localhost:4000/api/v1/health`.

### Перенести демонстрационную базу на Digital Q.DataBase

```powershell
$env:SOURCE_DATABASE_URL='postgres://db:db@127.0.0.1:55850/db'
$env:TARGET_DATABASE_URL='postgres://qdbadmin:qdbadmin@127.0.0.1:15432/postgres'
node scripts/qdb-04-migrate.mjs
node scripts/qdb-05-verify.mjs     # -> VERDICT: MIGRATION VERIFIED
```

Порты контейнера Digital Q.DataBase: `15432` (протокол PostgreSQL), `15443`
(протокол Microsoft SQL), `15444`, `15445`. Подробности — в
[`docs/START_HERE_QDB.md`](docs/START_HERE_QDB.md).

## Скрипты

| Скрипт | Назначение |
|---|---|
| `npm run dev` | Параллельно API (4000) и Web (5173) |
| `npm run build` | Сборка обеих частей |
| `npm run test` | Vitest в `apps/api` |
| `npm run lint` | Линт API и Web |
| `npm run db:up` | Встроенный PostgreSQL на `127.0.0.1:55850` |
| `npm run db:down` | Остановить встроенный PostgreSQL |
| `npm run db:migrate` | Применить `db/migrations/*.sql` с контролем `schema_migrations` |
| `npm run db:seed` | Загрузить идемпотентный демонабор из `db/seed` |

Отдельно, вне `package.json`: `scripts/demo-reset.mjs` возвращает демо-базу в
исходное состояние D0, `scripts/capture-qdb-screenshots.ps1` переснимает экраны
приложения, работающего на Q.DataBase.

## Структура репозитория

```text
lapa-ryadom/
├── apps/
│   ├── api/   # Fastify + Zod + pg
│   └── web/   # React + Vite
├── db/
│   ├── migrations/  # версионированный SQL
│   └── seed/        # воспроизводимый демонабор
├── scripts/         # миграции, seed, перенос на Q.DataBase, презентация
├── slides/          # презентация конкурса и снимки экранов
├── docs/            # проектные документы и отчёты о проверках
└── pics/            # иллюстрации
```

## Безопасность и секреты

- `SERVER_OFFER_SECRET` — единственный источник секретных кодов предложений.
  Берётся из переменных окружения, **не** из репозитория.
- Пароли хешируются Argon2id. В базе нет открытых паролей и кодов.
- Одноразовый код предложения показывается один раз, в базе лежит только его
  хеш — восстановить выданные коды из базы нельзя.
- `idempotency_key` генерируется клиентом (UUIDv4) и хранится как `UNIQUE`.
- В репозитории лежит только `.env.example` с заглушками.

## Презентация

`slides/` собирается в `slides/output/lapa-ryadom-pitch.pptx`:

```powershell
cd slides
node compile.js
```

Сборку запускать из каталога `slides` — иначе относительные пути к изображениям
не разрешатся.

QR-код на последнем слайде ведёт на этот репозиторий. Он генерируется
`slides/make_qr.py` — собственная реализация без внешних зависимостей;
корректность матрицы сверена с независимым генератором (совпали все 1089
модулей). Перегенерировать: `python slides/make_qr.py`.

## Демонстрационные данные

Приюты, потребности и передачи в демонстрационной базе вымышлены. Метрики
эффективности проекта не измерялись и в репозитории не приводятся.

## Лицензия

Учебный проект, МТУСИ, Колледж Телекоммуникаций, 2026.