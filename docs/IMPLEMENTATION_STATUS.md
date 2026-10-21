# Лапа рядом — статус реализации

**Дата начала:** 21 октября 2026 г.
**Ведётся:** ИИ-агент (ведущий full-stack)
**Связанные документы:** `00_PROJECT_CONCEPT.md` — `07_DEMO_AND_PITCH.md`.

## 0. Состояние среды (21.10.2026, фактическое)

| Компонент | Факт |
|---|---|
| OS | Windows 11 (10.0.28000) |
| Git | 2.54.0 ✅ |
| Node.js | 24.15.0 ✅ (LTS-канал) |
| npm | 11.12.1 ✅ (workspaces) |
| PostgreSQL клиент `psql` | ❌ отсутствует |
| PostgreSQL сервер | ❌ не установлен, порт 55432 свободен |
| Docker | ❌ не установлен (нет `docker`) |
| `embedded-postgres` | ⏳ подключается в DEV-02, даёт локальный PostgreSQL без системной установки |
| Digital Q.DataBase | 🚫 `BLOCKED` — реальный экземпляр не предоставлен (см. QDB-01) |

**Следствие.** Локальный PostgreSQL поднимается через `npm run db:up` (папка `.pg-runtime/` внутри репозитория). Это даёт воспроизводимое dev-окружение без `winget install postgresql` и без Docker. Целевая Digital Q.DataBase остаётся отдельной задачей (см. ниже).

## 1. Организационный трек (ORG-* / QDB-01)

### ORG-01 — участие Миланы и формат выступления (`BLOCKED`)

- 27.10.2026 — день СУБД, блок награждения хакатона 18:40–18:55.
- Подтверждение участия и допустимого хронометража от организаторов не зафиксировано.
- Действие: запросить у организатора / куратора; пока считаем `UNCONFIRMED`.

### ORG-02 / QDB-01 — Digital Q.DataBase (`BLOCKED`)

- Реальный экземпляр не предоставлен. До обращения экземпляра объявлять миграцию выполненной запрещено.
- Доступные параллельные шаги: проверка DDL из `db/migrations/001_initial.sql` на PostgreSQL, подготовка скриптов переноса и верификации.

### ORG-03 — состав артефактов (`UNCONFIRMED`)

- Источники: `01_PRODUCT_REQUIREMENTS.md` §10, `07_DEMO_AND_PITCH.md` §6.
- Решается после ORG-01 и ORG-02.

## 2. Инженерный трек (DEV-*)

### DEV-01 — репозиторий и команды (`DONE`)

- **Статус:** `DONE`. Каркас monorepo, smoke-тесты API и type-check API+Web пройдены.
- **Изменено:**
  - `package.json` (root, workspaces, скрипты `dev`, `build`, `test`, `db:up`, `db:down`, `db:migrate`, `db:seed`)
  - `.gitignore`, `.env.example`, `README.md`
  - `apps/api/` каркас Fastify + Zod + `pg` (`main.ts`, `app.ts`, `config/env.ts`, `routes/health.ts`, `routes/db-diagnostics.ts`, `db/pool.ts`, `test/smoke.test.ts`)
  - `apps/web/` каркас React + Vite + React Router (`index.html`, `main.tsx`, `app/router.tsx`, `app/AppLayout.tsx`, `styles/global.css`, заглушки страниц)
  - `scripts/start-pg.mjs`, `scripts/stop-pg.mjs` (заглушка), `scripts/migrate.mjs` (заглушка), `scripts/seed.mjs` (заглушка)
- **Проверено (реальные команды, PASS):**
  - `npm install` → `added 339 packages, audited 342 packages in 1m` (`exit 0`).
  - `npx tsc -p apps/api/tsconfig.json --noEmit` → без вывода, `exit 0`.
  - `npx tsc -p apps/web/tsconfig.json --noEmit` → без вывода, `exit 0` (после исключения `vite.config.ts` из строгой проверки: Vite установлен и в root, и в apps/web, типы двух разных копий не совместимы при строгой проверке).
  - `npx vitest run --root apps/api` → `Test Files 1 passed (1)`, `Tests 2 passed (2)`. Сценарии: `/api/v1/health` отвечает `ok`, неизвестный маршрут отдаёт `404`.
- **Найденные и устранённые дефекты:**
  1. Vitest упал на этапе сборки схемы из-за попытки использовать Zod в `response` для Fastify → заменил на явное Fastify-сообщение, без response-схемы (валидация ответов появится вместе с zod-fastify-type-provider позже).
  2. `tsx` не подхватывал `.env` из корня monorepo. Поправил `config/env.ts`: грузит `.env` сначала из `<root>/.env`, потом из `process.cwd()`.
- **Следующая задача:** DEV-02 — фактический запуск встроенного PostgreSQL.

### DEV-02 — запуск исходного PostgreSQL (`DONE`)

- **Статус:** `DONE`. PostgreSQL 17.10 живёт в проекте, без системной установки.
- **Изменено:** `scripts/start-pg.mjs` (включая идемпотентный повторный запуск и `mkdirSync(persistDir)` + `start-pg.pid`).
- **Проверено (реальные команды, PASS):**
  - `node scripts/start-pg.mjs` с переменными `PG_RUNTIME_DIR=.pg-runtime`, `PGPORT=55432`, `PGUSER=db`, `PGPASSWORD=db`. Лог сервера:
    ```
    starting PostgreSQL 17.10 on x86_64-windows, compiled by msvc-19.44.35226, 64-bit
    listening on IPv4 address "127.0.0.1", port 55432
    database system was shut down at 2026-10-21 17:05:10 MSK
    database system is ready to accept connections
    ```
  - `Test-NetConnection 127.0.0.1:55432` → `True`.
  - `Get-Content .pg-runtime\start-pg.pid` → `45344`.
  - API endpoint `GET /api/v1/db/ping` → `{"status":"ok","result":1,"timestamp":"…"}` — реальный `SELECT 1 AS ok`.
  - API endpoint `GET /api/v1/health/detail` → `{"status":"ok","db":true,...}`.
- **Найденные и устранённые дефекты:**
  1. Повторный запуск скрипта падал на `initdb: error: directory exists but is not empty`. Теперь скрипт проверяет наличие `PG_VERSION` и пропускает `pg.initialise()`.
- **Файлы данных:** `.pg-runtime/data/` (в `.gitignore`). Удаление папки = чистая инициализация с нуля.
- **Следующая задача:** DEV-03 — реальные миграции `db/migrations/*.sql` и исполнитель `scripts/migrate.mjs`.

### DEV-03 — миграция схемы (`PENDING`)

- Файлы `db/migrations/001_initial.sql` и `002_auth_sessions.sql` — точная копия SQL из `03_DATA_MODEL.md` §4.
- `scripts/migrate.mjs` — реальный исполнитель с `schema_migrations`.

### DEV-04 — seed (`PENDING`)

- Идемпотентный демосценарий с 3 приютами и 8–12 потребностями.

### DEV-05 → DEV-17, QA-*, QDB-02 → QDB-05, DEMO-01 → DEMO-05

- Все в очереди после DEV-04. Полный список — `05_DEVELOPMENT_PLAN.md`.

## 3. Риски и блокеры (живой список)

1. **Digital Q.DataBase отсутствует** → QDB-01, ORG-02.
2. **Подтверждение формата выступления Миланы** → ORG-01.
3. **Контейнерный PostgreSQL недоступен (нет Docker)** → используем `embedded-postgres`. Это рабочая замена; синтаксис совместим с PostgreSQL 15/16.
4. **Окно до дедлайна конкурса** — `до 21.10.2026`. Сегодня уже 21.10.2026, поэтому организационный трек имеет приоритет № 1.

## 4. Факты проверки

Команды и результаты заносятся сюда по мере исполнения. Текущая итерация записывает:

- `node --version` → `v24.15.0` ✅
- `npm --version` → `11.12.1` ✅
- `git --version` → `2.54.0.windows.1` ✅
- `docker --version` → not found ❌
- `psql --version` → not found ❌

См. коммит «DEV-01: создать каркас monorepo». Следующий коммит — после успешного `npm install` + smoke-теста API.
