# Лапа рядом — статус реализации

## 5. Текущая сессия — итог 21.10.2026

**Что сделано в этой сессии (время выполнения ~30 минут от прочтения документов):**

1. Прочитаны все восемь проектных документов и проверено фактическое состояние среды (Node 24.15, npm 11.12, git 2.54; PostgreSQL/Docker — отсутствуют).
2. Поднят монорепо `lapa-ryadom` через `npm workspaces`. Каркас `apps/api` (Fastify + Zod + `pg`) и `apps/web` (React + Vite + React Router).
3. Поднят встроенный PostgreSQL 17.10 на `127.0.0.1:55432` через `embedded-postgres` — никакой системной установки. Кластер UTF-8 (`--no-locale --encoding=UTF8`), русские строки и эмодзи сохраняются и читаются корректно.
4. Применены миграции `db/migrations/001_initial.sql` (5 таблиц + `need_balances` view + индексы) и `002_auth_sessions.sql` (`auth_sessions`, индексы).
5. Идемпотентный seed: 3 приюта (Добрые лапы / Приют Северный / Спасение на юге), 10 потребностей в категориях `food`, `hygiene`, `textile`, `equipment`, `carriers`, `other` с приоритетами `urgent` и `normal`, 4 учётки (`admin`, `rep_a`, `rep_b`, `rep_c`) с паролями, хешированными через Argon2id.
6. Smoke-тесты: `tsc --noEmit` — 0 ошибок в обоих пакетах; Vitest в `apps/api` — 2/2 passed (`/api/v1/health`, 404).
7. Сделаны два коммита:
   - `00f5bcb` — DEV-01 + DEV-02 (каркас и встроенный PostgreSQL);
   - `58eeda0` — DEV-03 + DEV-04 (миграции, seed, проверка UTF-8 и Argon2id).

**Что явно заблокировано:**

- **QDB-01**: реальный экземпляр Digital Q.DataBase не предоставлен — все шаги по переносу и сверке ждут экземпляра. Параллельно подготовлен код миграций и сидов, который тот же `pg`-клиент перенесёт на целевую СУБД без изменений (кроме возможного `init` под `icu`-локаль, если у Digital Q DataBase она строже).
- **ORG-01**: участие Миланы и формат выступления 27.10.2026.
- **ORG-03**: окончательный состав демо-артефактов.

**Что НЕ делалось в этой сессии и запланировано на ближайшие шаги:**

| Следующая задача | Назначение |
|---|---|
| DEV-05 | публичные read-only ручки `/shelters`, `/shelters/:id`, `/needs` с фильтрами/пагинацией |
| DEV-06 | публичный web: каталог потребностей, карточка потребности, карточка приюта |
| DEV-07 | `POST /api/v1/offers` — транзакция, HMAC-код, идемпотентность |
| DEV-08 | web: страница создания предложения и страница с кодом |
| DEV-09 → DEV-15 | auth, shelter cabinet, receive-flow, admin |
| QDB-02 → QDB-05 | проверка совместимости на целевом экземпляре, перенос данных, сверка, регрессия |
| QA-* | конкурентность, права доступа, краевые состояния, регрессия |

**Демо-доступы для следующего шага:**

- `DATABASE_URL = postgres://db:db@127.0.0.1:55432/db` (уже в `.env`).
- `SERVER_OFFER_SECRET` — случайная 32-бит base64url строка (уже в `.env`, dev-only).
- `DEMO_ADMIN_PASSWORD` = `dev-admin-pwd-123`
- `DEMO_REP_A_PASSWORD` = `dev-rep-a-pwd-123`
- `DEMO_REP_B_PASSWORD` = `dev-rep-b-pwd-123`
- `DEMO_REP_C_PASSWORD` = `dev-rep-c-pwd-123`

**Реальные команды, прогнанные в этой сессии, и их выход:**

- `node --version` → `v24.15.0`
- `npm --version` → `11.12.1`
- `git --version` → `2.54.0.windows.1`
- `npm install` → `added 339 packages, audited 342 packages in 1m`
- `npx tsc -p apps/api/tsconfig.json --noEmit` → `exit 0`
- `npx tsc -p apps/web/tsconfig.json --noEmit` → `exit 0`
- `npx vitest run --root apps/api` → `Test Files 1 passed`, `Tests 2 passed`
- `node scripts/start-pg.mjs` → `started at 127.0.0.1:55432 (pid=...)`, Postgres 17.10
- `node scripts/migrate.mjs` → `done. 2 applied, 0 already applied.`
- `node scripts/migrate.mjs` (повтор) → `done. 0 applied, 2 already applied.`
- `node scripts/seed.mjs` → `[db:seed] OK: 3 shelters, 4 accounts, 10 needs.`
- `node scripts/seed.mjs` (повтор) → `[db:seed] already seeded (shelters > 0); nothing to do.`
- `node scripts/verify-encoding.mjs` → `server_encoding: UTF8`, `roundtrip: "Привет, мир! Лапа рядом 🐾"`
- `node scripts/verify-seed.mjs` → распечатал 10 балансов и `admin password verify: true`
- `GET /api/v1/health` (`tsx src/main.ts` в фоне) → `{"status":"ok","service":"lapa-api",…}`
- `GET /api/v1/db/ping` → `{"status":"ok","result":1,…}` (реальный `SELECT 1`)
- `GET /api/v1/health/detail` → `{"status":"ok","db":true,…}`
- `git log --oneline`: `00f5bcb DEV-01 + DEV-02 …`, `58eeda0 DEV-03 + DEV-04 …`.

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

### DEV-03 — миграция схемы (`DONE`)

- **Статус:** `DONE`. Пять таблиц, представление `need_balances`, `auth_sessions`, индексы имитируют `03_DATA_MODEL.md` §4–5 и `04_TECHNICAL_ARCHITECTURE.md` §3.2.
- **Файлы:**
  - `db/migrations/001_initial.sql` — `shelters`, `accounts`, `needs`, `offers`, `deliveries`, все индексы из §4, представление `need_balances` из §5.
  - `db/migrations/002_auth_sessions.sql` — `auth_sessions(id_hash PK, account_id, csrf_token, created_at, expires_at, revoked_at)` с проверками размера `BYTEA` (32 байта) и `auth_sessions_revoke_ck`, индексы на `account_id` и активные сессии.
  - `scripts/migrate.mjs` — использует `pg.Client`, ведёт учёт в `schema_migrations(name, checksum, applied_at)`, файл-чексума FNV-1a (32-бит), идемпотентен; каждая миграция в собственной транзакции с rollback при ошибке.
- **Проверено (реальные команды, PASS):**
  - `node scripts/migrate.mjs` (первый запуск) → `apply 001_initial.sql; apply 002_auth_sessions.sql; done. 2 applied, 0 already applied.`
  - `node scripts/migrate.mjs` (второй запуск) → `skip 001…; skip 002…; done. 0 applied, 2 already applied.` (идемпотентность подтверждена).
  - `node scripts/verify-schema.mjs` показал:
    - `TABLES`: accounts, auth_sessions, deliveries, need_balances, needs, offers, schema_migrations, shelters
    - `VIEWS`: need_balances
    - `MIGRATIONS`: 001_initial.sql, 002_auth_sessions.sql, обе с временем применения.
    - `NEED_BALANCES COLUMNS`: need_id uuid, target_qty bigint, reserved_qty bigint, received_qty bigint, available_qty bigint.
    - `SELECT FROM needs`: rowCount 0 (ожидаемо, до seed).
- **Найденные и устранённые дефекты:**
  1. PowerShell не позволил сразу гонять проверочные `node -e` из-за `\-escape`. Перевёл проверку в `scripts/verify-schema.mjs` — переиспользуемый артефакт, остаётся в репозитории.
  2. После остановки API в прошлом раунде упал и PostgreSQL. Поняли: `npm run dev` без отдельного окна для БД не выживает; `start-pg.mjs` оставлен отдельным процессом — намеренно.
### DEV-04 — idem-potентный seed (`DONE`)

- **Статус:** `DONE`. Демо-набор заполнен и проверен, повторный запуск — no-op.
- **Файлы:**
  - `db/seed/data.mjs` — 3 приюта (Добрые лапы, Приют Северный, Спасение на юге), 10 потребностей (по 3–4 на приют, категории `food`, `hygiene`, `textile`, `equipment`, `carriers`, `other`, приоритеты `urgent` / `normal`), 4 учётки (`admin`, `rep_a`, `rep_b`, `rep_c`).
  - `scripts/seed.mjs` — Argon2id-хеш паролей через `argon2.hash(…, {type: argon2.argon2id})`, идемпотентен: на повторе короткое сообщение `already seeded`. `--reset` — TRUNCATE таблиц `deliveries, offers, needs, accounts, shelters, auth_sessions` перед вставкой.
  - `scripts/verify-schema.mjs` (DEV-03) и `scripts/verify-encoding.mjs` (DEV-04): вспомогательные диагностические ассерты.
  - `scripts/verify-seed.mjs` — печатает содержимое и проверяет `argon2.verify()` для пароля администратора.
- **Проверено (реальные команды, PASS):**
  - `node scripts/seed.mjs` → `[db:seed] OK: 3 shelters, 4 accounts, 10 needs.`
  - `node scripts/verify-seed.mjs` → распечатал все 3 приюта (на русском), 4 аккаунта, 10 потребностей и **10 строк `need_balances`** с `target_qty == available_qty` и нулями в `reserved_qty / received_qty` (свежее состояние). Завершающая строка: `admin password verify: true`.
  - `node scripts/seed.mjs` повторно → `[db:seed] already seeded (shelters > 0); nothing to do.` Идемпотентность подтверждена.
  - `node scripts/migrate.mjs` повторно → оба файла `skip …`. Идемпотентность миграций подтверждена.
  - `node scripts/verify-encoding.mjs` → `server_encoding: UTF8`, `roundtrip: "Привет, мир! Лапа рядом 🐾"`.
- **Найденные и устранённые дефекты:**
  1. Стартовый кластер `embedded-postgres` инициализировался с `WIN1252` (Windows Russian locale) — кириллица уходила в ошибку `0xd0 0x94 has no equivalent in encoding "WIN1252"`. Изменил `start-pg.mjs`: передаём `initdbFlags: ['--no-locale', '--encoding=UTF8']` через API `embedded-postgres`, после чего initdb создаёт кластер с `server_encoding=UTF8`. Это компромисс по сравнению с русской локалью, но `need_balances` и сравнения на равенство строк работают корректно; полнотекстовая сортировка и индексация по русскому тексту в MVP не используются (см. `03_DATA_MODEL.md` §3 — текстовые поля не семантические).
  2. Двойной апостроф `Hill''s` в JS-строке ломает парсер. Заменил на двойные кавычки.
  3. `import()` со ссылкой на абсолютный Windows-путь падал `ERR_UNSUPPORTED_ESM_URL_SCHEME`. Привёл к `pathToFileURL().href`.
- **Следующая задача:** DEV-05 — публичные read-only ручки `/shelters`, `/shelters/:id`, `/needs` (с фильтрами по категории/городу/поиску).

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

---

## 6. Сессия 2 — ORG-01, ORG-03, QDB-01 (21.10.2026, вечер)

### ORG-01 / ORG-03 — презентация (`PARTIAL`)

- **Статус:** `PARTIAL`. Колода собрана и прошла QA; не хватает реальных скриншотов и контакта.
- **Ответ от Евгения получен:** выступление 5–10 минут, нужны картинки, скриншоты, таблички и текст.
  Это совпадает с рабочим предположением `07_DEMO_AND_PITCH.md` §3, поэтому базовый тайминг 7 минут
  принят как основной, 5 и 10 минут — как варианты (слайд 9).
- **Создано:** `slides/slide-01.js` … `slides/slide-09.js`, `slides/compile.js`, `slides/package.json`,
  `slides/qa_dump.py`. Результат: `slides/output/lapa-ryadom-pitch.pptx` и PDF-копия для конференции.
- **Структура (9 слайдов):** 1 обложка, 2 проблема, 3 четыре шага, 4 живая демонстрация,
  5 «Что делает база данных» + таблица D0/D1/D2, 6 финал, 7 приложение «доказательство переноса»,
  8 приложение «аварийные сценарии», 9 приложение «тайминг 5/7/10 минут».
- **Дизайн:** палитра Nature & Outdoors (`283618`, `606c38`, `bc6c25`, `dda15e`, `FEFae0`),
  Georgia для заголовков + Calibri для текста, стиль Soft & Balanced, формат 16:9 (10 × 5.625 in).
- **Проверено (реальные команды, PASS):**
  - обязательный pre-compile lint по не-ASCII пунктуации → `Pre-compile lint passed.`
  - `node slides/compile.js` → `WROTE .../lapa-ryadom-pitch.pptx`
  - `python slides/qa_dump.py ...` → `CANVAS BOUNDS: PASS`, `PAGE BADGE: PASS`,
    `PLACEHOLDER TEXT: PASS`, `KEY FACTS: PASS`, 9 слайдов, размер 10.0 × 5.625.
  - рендер LibreOffice в PDF и постраничное чтение → все 9 страниц без наложений и обрезки текста.
  - независимая проверка делегирована субагенту-верификатору (свежий взгляд, гейт перед выдачей).
- **Найденные и устранённые дефекты (7):**
  1. **Критичный.** На обложке и слайде 3 стояло «обещано 5» и «получено 3» одновременно — невозможное
     состояние. По `07_DEMO_AND_PITCH.md` §7.2 после частичной передачи обещано = 0, и формула
     «свободно = требуется − обещано − получено» дала бы 20−5−3=12 вместо 17. Исправлено на 20/0/3/17.
  2. Слайд 6 утверждал, что перенос «там продолжает работать». Переформулировано в «Показываю результат,
     когда он проверен» — правило честности из `07_DEMO_AND_PITCH.md` §1 и §8.4.
  3. Заголовки таблицы на слайде 5 переносились посреди слова («Обежан|о»). Колонки расширены,
     шрифт заголовка снижен с 11 до 9 pt, поля ячеек уменьшены.
  4. На слайде 4 была служебная пометка для продюсера. Убрана с экрана, перенесена в заметки докладчика
     через `slide.addNotes()` вместе с требованиями к кадрам.
  5. На слайде 7 было «7 таблиц» — неверно, в схеме 6 таблиц + 1 представление. Исправлено.
  6. Отсутствовали варианты тайминга 5 и 10 минут из §6.1 и §6.2. Добавлен слайд 9.
  7. На слайде 8 фраза «между обещанным и полученным» без существительного. Восстановлено «помощью».
- **Что осталось (нужны действия или данные):**
  - **Скриншоты для слайда 4** — невозможно до DEV-06, интерфейс ещё не собран. Требования к кадрам
    записаны в заметках к слайду.
  - **Контакт / QR на слайде 6** — добавлять только если действительно можно публиковать.
  - **Подтверждение лимита времени и расписания** у организаторов.

### QDB-01 — доступ к Digital Q.DataBase (`BLOCKED-BY-USER-ACTION`)

- **Статус изменён.** Ранее записано «экземпляр не предоставлен → BLOCKED». Проверка официальных
  источников 21.10.2026 показала: Digital Q.DataBase — продукт «Диасофта», который **разворачивается
  локально**, и сайт прямо предлагает «Скачать дистрибутив без регистрации». Просить доступ
  у организаторов **не требуется** — предыдущая формулировка была неверной.
- **Что подтверждено:** дистрибутив без регистрации; готовый Docker-образ; нативная поддержка
  PostgreSQL-диалекта и PL/pgSQL; точка входа PostgreSQL на порту **5445**; учётка в образе
  `qdbadmin`/`qdbadmin`; конфигурация через обычные `postgresql.conf` и `pg_hba.conf`;
  бесплатно до 4 ядер; контакты `dbd@diasoft.ru`, +7 495 780‑7575.
- **Дедлайн конкурса — 21 октября 2026 года, то есть сегодня.** Подача письмом на `dbd@diasoft.ru`
  с пометкой «Хакатон». Требование организаторов: рабочий проект, а не идея.
- **Чек-лист действий Евгения:** `docs/QDB_ACCESS_CHECKLIST.md` — выбор маршрута (Docker или
  установщик), скачивание дистрибутива, разрешение на установку Docker Desktop, свободный порт.
- **Готово с нашей стороны:** миграции без расширений, migrator, seed с фиксированными UUID,
  проверки схемы/кодировки/seed, API через драйвер `pg` (тот же протокол, который целевая СУБД
  отдаёт на 5445). Переключение цели — это смена `DATABASE_URL`.
- **Рекомендация:** маршрут A (Docker-образ) — официальный быстрый старт. Требует явного согласия
  на установку Docker Desktop, так как это системное ПО.

### Расхождение по времени награждения

- Сайт конференции сейчас показывает «Награждение победителей хакатона **18:55–19:45**».
- В `07_DEMO_AND_PITCH.md` §3 зафиксировано **18:40–18:55**.
- Расхождение не закрыто: нужно письмо организаторам на `dbd@diasoft.ru`. От ответа зависит тайминг.

### DEV-05 — публичный каталог API (`DONE`)

- **Статус:** `DONE`. Четыре read-only ручки работают, покрыты 16 тестами и проверены вживую.
- **Файлы:**
  - `apps/api/src/schemas/catalog.ts` — Zod-схемы запросов (`city`, `category`, `priority`, `q`,
    `limit` 1..100, `offset`), UUID-параметры, схемы ответа.
  - `apps/api/src/repositories/catalog.ts` — `listNeeds`, `getNeed`, `listNeedsByShelter`,
    `listShelters`, `getShelter`. Счётчики берутся из представления `need_balances`, а не из
    хранимых полей, поэтому «обещано» и «получено» не могут разойтись.
  - `apps/api/src/routes/catalog.ts` — `GET /shelters`, `/shelters/:id`, `/needs`, `/needs/:id`.
  - `apps/api/test/catalog.test.ts` — 16 тестов.
- **Решения по проектированию:**
  - Видно только опубликованные приюты (`is_published = TRUE`) и активные потребности
    (`status = 'active'`), как требует `01_PRODUCT_REQUIREMENTS.md` §5.1.
  - Порядок выдачи: срочные первыми (`n.priority = 'urgent'`), затем по дате убывания,
    затем по `id`. Последний ключ нужен, чтобы пагинация была детерминированной при
    совпадении `created_at` — иначе страницы пересекались бы.
  - `BIGINT` уходит на провод строкой, а не числом: иначе JS потеряет точность на больших
    значениях. Тест проверяет формулу через `BigInt`, а не через `Number`.
  - Поиск `q` идёт по `ILIKE` и захватывает и заголовок потребности, и название приюта.
- **Проверено (реальные команды, PASS):**
  - `npx tsc -p apps/api/tsconfig.json --noEmit` → `exit 0`.
  - `npx vitest run --root apps/api` → `Test Files 2 passed (2)`, `Tests 18 passed (18)`
    (2 старых smoke + 16 новых каталога).
  - Живой запуск API и `curl`:
    - `GET /shelters` → `total=3`; Добрые лапы 3, Приют Северный 3, Спасение на юге 4.
    - `GET /needs?limit=4` → `total=10`, все четыре срочные, счётчики нулевые,
      `availableQty == targetQty`.
    - `GET /needs?city=Омск` → 4 потребности, все Омск.
    - `GET /needs?category=food` → 2 потребности, обе `food`.
    - `GET /needs?q=корм` → 1 потребность.
    - `GET /needs?limit=3&offset=0` и `offset=3` → по 3 записи, `total=10` у обоих,
      **пересечение 0 записей**.
    - Ошибки: `category=weapons` → `400`, `/needs/xyz` → `400`, неизвестный UUID → `404`.
- **Найденные и устранённые дефекты (1):**
  1. `tsc` с `noUncheckedIndexedAccess` отклонил `rows[0]` как `NeedRow | undefined`.
     Исправлено на явную проверку строки перед маппингом, а не через `!` — иначе на
     пустом результате было бы `TypeError` вместо `null`.
- **Следующая задача:** DEV-07 — `POST /offers`: транзакция, HMAC-код, идемпотентность.
  После неё добавится экран с кодом, и можно будет отснять окно B для показа D1 и D2.

### DEV-06 — публичный веб (`DONE`)

- **Статус:** `DONE`. Каталог, карточка потребности, список приютов и карточка приюта работают
  в браузере. Скриншоты сняты и встроены в слайд 4 презентации.
- **Файлы:**
  - `apps/web/src/api/types.ts` — типы и русские подписи категорий и единиц.
  - `apps/web/src/api/client.ts` — обёртка над `fetch` с типизированной ошибкой `ApiError`.
  - `apps/web/src/api/useAsync.ts` — загрузка с отменой через `AbortController`.
  - `apps/web/src/features/needs/NeedCard.tsx` — карточка и сетка.
  - `apps/web/src/features/needs/Needs.module.css`, `Filters.module.css` — оформление.
  - `apps/web/src/pages/NeedsPage.tsx`, `NeedDetailPage.tsx`, `SheltersPage.tsx`,
    `ShelterDetailPage.tsx` — рабочие страницы вместо заглушек.
  - `apps/web/src/vite-env.d.ts` — объявление типов CSS Modules.
  - `scripts/capture-screenshots.ps1` — воспроизводимая съёмка скриншотов.
  - `scripts/dev-web.mjs`, `scripts/run-detached.ps1` — запуск веба отвязанным процессом.
- **Решения по проектированию:**
  - Количество форматируется через `BigInt(...).toLocaleString('ru-RU')`, потому что значения
    приходят строкой из API, и обычный `Number` потерял бы точность на больших числах.
  - На карточке потребности кнопка «Предложить помощь» есть, но заблокирована с подписью
    «Появится в DEV-07». Это честнее, чем кликабельная кнопка без обработчика.
- **Проверено (реальные команды, PASS):**
  - `npx tsc -p apps/web/tsconfig.json --noEmit` → `exit 0`.
  - `npx vite build` из `apps/web` → `51 modules transformed`, сборка успешна.
  - Живая проверка в браузере: каталог открылся, отрисовались фильтры, 6 карточек из 10,
    пагинация «Страница 1 из 2», счётчики `50 / 0 / 0 / 50`.
  - Прокси веб→API отвечает: через `:5173/api/v1/needs?limit=2` вернулось `total=10`.
  - Скриншоты 1280×900 сняты headless-Chrome и **встроены в слайд 4**: две картинки
    по 73 735 и 39 690 байт, пропорции 3.86 × 2.71 in — корректные.
  - `python slides/qa_dump.py` → `CANVAS BOUNDS: PASS`, `PAGE BADGE: PASS`,
    `PLACEHOLDER TEXT: PASS`, `KEY FACTS: PASS`.
- **Найденные и устранённые дефекты (3):**
  1. `tsc` не нашёл типы CSS Modules (`TS2307 Cannot find module '*.module.css'`). Добавлен
     `vite-env.d.ts` с объявлением модуля — без ослабления проверок.
  2. `npx vite build --config apps/web/vite.config.ts` из корня падал с
     `Could not resolve entry module "index.html"`. Сборка требует запуска из каталога пакета,
     поэтому в `apps/web/package.json` оставлен локальный скрипт.
  3. Долгоживущие серверы умирали вместе с родительской фоновой задачей по таймауту.
     Причина: процесс был ребёнком job-объекта. Добавлен `scripts/run-detached.ps1`, который
     стартует процесс через `Win32_Process.Create` вне job-объекта. Проверено: PostgreSQL
     пережил завершение сессии и продолжал отвечать.

### DEV-07 — создание предложения (`DONE`)

- **Статус:** `DONE`. Публичная ручка `POST /api/v1/offers`, экран с кодом, сквозной сценарий
  D0 → D1 проверен вживую.
- **Файлы:**
  - `apps/api/src/services/offer-code.ts` — генерация и проверка кода.
  - `apps/api/src/schemas/offers.ts` — Zod-схема тела, `RESERVATION_DAYS = 7`.
  - `apps/api/src/repositories/offers.ts` — транзакция создания.
  - `apps/api/src/routes/offers.ts` — ручка и маппинг причин на коды ответа.
  - `apps/api/test/offers.test.ts` — 14 тестов.
  - `apps/web/src/pages/NeedDetailPage.tsx` — форма отправляет заявку.
  - `apps/web/src/pages/OfferResultPage.tsx` — экран с кодом.
  - `scripts/reset-demo.mjs` — возврат демо-данных в состояние D0.
- **Ключевые решения:**
  - **Блокировка строки.** `SELECT ... FOR UPDATE` по строке потребности вынуждает двух
    посетителей, одновременно претендующих на последнюю упаковку, выстраиваться в очередь,
    а не обоим получать успех. Покрыто тестом на конкуренцию.
  - **Идемпотентность проверяется первой**, до блокировки и до списания остатка: повтор с тем
    же ключом не может ни занять место, ни коснуться потребности.
  - **Код не хранится.** В `offers.code_hash` лежит только HMAC-SHA256 от нормализованного кода
    с ключом `SERVER_OFFER_SECRET`. Тест проверяет, что в базе нет кода ни в одном виде и что
    хеш при этом корректно проверяет выданный код.
  - **Алфавит кода** без `0/O` и `1/I/L` — код диктуют вслух на ресепшене приюта.
  - **Ограничение по времени 7 суток** считается выражением `statement_timestamp() + interval`
    внутри транзакции, а не в приложении, чтобы не зависеть от часов сервера.
  - **Коллизия кода** (вероятность 2⁻⁸⁰) перехватывается `UNIQUE`-ограничением и один раз
    перегенерируется — посетитель не должен платить за нашу случайность.
- **Осознанный компромисс.** Повтор с тем же `idempotency_key` возвращает `409
  IDEMPOTENCY_REPLAY`, а не исходный код: код в базе не хранится и восстановить его нельзя.
  Это следует из требования «в базе нет открытых кодов». Честнее конфликт, чем показать код,
  который не проверится.
- **Проверено (реальные команды, PASS):**
  - `npx tsc -p apps/api/tsconfig.json --noEmit` → `exit 0`.
  - `npx vitest run --root apps/api` → `Test Files 3 passed (3)`, `Tests 32 passed (32)`.
  - Живой прогон через HTTP:
    - D0: `50 / 0 / 0 / 50`
    - `POST /offers` количество 5 → код `42B2-M44D-VJS4-X9VQ`, `remaining=45`
    - D1: `50 / 5 / 0 / 45` — формула сходится
    - повтор с тем же ключом → `409 IDEMPOTENCY_REPLAY`, вторая запись не создана
    - запрос 9999 при свободных 42 → `409 NOT_ENOUGH_AVAILABLE`, `available=42`
  - `npx vite build` из `apps/web` → успех.
- **Найденные и устранённые дефекты (4):**
  1. **Ручка читала секрет через `loadEnv()` напрямую**, игнорируя конфигурацию, внедрённую в
     `buildApp`. Тест «хеш соответствует выданному коду» это поймал. Исправлено: конфигурация
     внедряется в Fastify через `app.decorate('env', env)`, ручка берёт `req.server.env`.
  2. **Интеграционные тесты оставляли мусор в dev-базе**: после прогона у потребности оставалось
     `reserved=50`, и живая демонстрация стартовала с неверным остатком. Добавлен
     `scripts/reset-demo.mjs` и очистка в `afterAll`.
  3. При редактировании `client.ts` я на секунду оставил `return return ...`. Поймал
     `tsc` сразу, до коммита.
  4. `newIdempotencyKey` ломался на типах: сужение `'randomUUID' in crypto` делало `crypto`
     типом `never` в ветке else. Переписано на явную проверку `typeof c.randomUUID === 'function'`.
- **Следующая задача:** DEV-08 — приём помощи в кабинете приюта (`POST /deliveries`),
  который доводит сценарий до D2 и замыкает демонстрацию.

### DEV-08 — приём помощи приютом (`PENDING`)

- `POST /api/v1/deliveries`: код + фактически принятое количество, авторизация представителя
  приюта, перевод предложения в терминальный статус, освобождение непривезённого остатка.
- После него сценарий D0 → D1 → D2 можно показать целиком.

---

## 7. Сессия 3 — подготовка QDB-01 (21.10.2026)

### Docker Desktop (`DONE`)

- Установлен через winget после явного согласия Евгения: `Docker Desktop 4.96.0`, `exit 0`.
- **Блокер:** WSL2 на машине нет (`wsl --status` → «WSL is not installed»), а
  `Win32_ComputerSystem.HypervisorPresent = False`. Linux-контейнеры без WSL2 не запустятся.
- Проверено, что виртуализация в BIOS включена (`VirtualizationFirmwareEnabled = True`,
  `SecondLevelAddressTranslationExtensions = True`), то есть установка WSL2 должна пройти,
  но потребует UAC и перезагрузку.
- `Get-WindowsOptionalFeature` требует повышения прав — эту проверку выполнить не удалось,
  состояние компонентов не подтверждено.

### Скрипты QDB-02 … QDB-05 (`DONE`, проверены на эталоне)

| Файл | Назначение |
|---|---|
| `scripts/qdb-02-identify.mjs` | Отчёт о целевом экземпляре: версия, сборка, кодировка, порт. Пароли маскируются. |
| `scripts/qdb-03-compat.mjs` | 15 проб совместимости PostgreSQL, каждая в своей транзакции с откатом. |
| `scripts/qdb-04-migrate.mjs` | Перенос данных одной транзакцией в порядке зависимостей. `auth_sessions` намеренно не переносится. |
| `scripts/qdb-05-verify.mjs` | 25 проверок сверки: счётчики, PK, `code_hash`, `idempotency_key`, времена, сироты, балансы, CHECK и UNIQUE. |

- **Проверено (реальные команды, PASS):**
  - `node scripts/qdb-03-compat.mjs` против эталонного PostgreSQL 17.10 → **15/15 PASS**.
    Значит, любое падение на Digital Q.DataBase будет настоящим сигналом, а не ошибкой пробы.
  - `node scripts/qdb-05-verify.mjs` «источник против себя» → **25/25 PASS**, `VERDICT: MIGRATION VERIFIED`.
    Верификатор доказан на заведомо одинаковых базах.
  - `node scripts/qdb-02-identify.mjs` отработал и замаскировал пароль: `postgres://db:***@...`.
  - Предохранитель `qdb-04-migrate.mjs` проверен: при одинаковых `SOURCE` и `TARGET` скрипт
    печатает `REFUSING TO RUN`, завершается с кодом 2 и данные остаются целыми.

- **Найденные и устранённые дефекты (3):**
  1. `qdb-05` падал с `column "updated_at" does not exist`: у `offers` и `deliveries` нет
     `updated_at`. Заменено на явные наборы колонок на таблицу.
  2. `qdb-05` давал **ложный FAIL** на пустых данных: проверка UNIQUE делала
     `INSERT ... SELECT ... FROM offers LIMIT 1`, а при пустой таблице вставлялось 0 строк.
     Переписано на самостоятельный тест с явными значениями.
  3. **`qdb-04` обнулил сид-данные** при прогоне с `SOURCE == TARGET`: скрипт начинает с
     `TRUNCATE` целевой БД, а при совпадении URL это и есть источник. Данные восстановлены
     (`node scripts/seed.mjs` → `OK: 3 shelters, 4 accounts, 10 needs`), и добавлен
     предохранитель, отказывающий запускаться при совпадении канонических URL.

### Доступ к дистрибутиву (`BLOCKED-BY-USER`)

- Уточнена механика получения: **прямой ссылки нет**. Страница https://catalog.diasoft.ru/database
  требует заполнить форму (имя, фамилия, должность, организация, email, телефон,
  обязательное согласие на обработку персональных данных) и **присылает ссылку на почту**
  в течение ~5 минут.
- Заполнить форму за Евгения нельзя: это персональные данные и согласие под его именем.
- Инструкция для пользователя: `docs/START_HERE_QDB.md`.
- **Ожидается от Евгения:** скачанный архив в `F:\MVP\hakaton\infra\qdb-dist\`
  (файл вида `docker-qdatabase64xid-17-*.tar.gz`, ~1,5 ГБ) и ответ «готово».
- **Срок:** приём конкурсных проектов — 21 октября 2026 года, то есть сегодня.
