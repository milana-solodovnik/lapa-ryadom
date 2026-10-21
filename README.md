# «Лапа рядом»

Сервис адресной вещевой помощи приютам для животных. Посетитель без регистрации выбирает потребность приюта, резервирует посильное количество и получает одноразовый секретный код. Представитель приюта подтверждает фактическую передачу — система пересчитывает **требуется / обещано / получено / свободно**.

> Источник истины по требованиям и процессу: документы `docs/00_PROJECT_CONCEPT.md` — `docs/07_DEMO_AND_PITCH.md`. Этот файл — инструкция разработчика и ИИ-агента.

## Стек

| Слой | Технология |
|---|---|
| Веб | React 18 + TypeScript + Vite + React Router (CSS Modules) |
| API | Node.js 24 LTS + TypeScript + Fastify + Zod |
| БД (разработка) | PostgreSQL 16, поднимается локально через `embedded-postgres` (без системной установки) |
| БД (целевая) | Digital Q.DataBase — доступ в работе |
| Авторизация сотрудников | Argon2id + cookie-сессии в таблице `auth_sessions` |
| Тесты | Vitest (unit + integration), Playwright (E2E) |

## Структура репозитория

```text
lapa-ryadom/
├── apps/
│   ├── api/   # Fastify + Zod + pg
│   └── web/   # React + Vite
├── db/
│   ├── migrations/  # версионированный SQL
│   └── seed/        # воспроизводимый демонабор
├── scripts/         # миграции, seed, миграция данных, встроенный pg
├── tests/           # unit / integration / concurrency / e2e
├── infra/           # вспомогательные конфиги для развёртывания
└── docs/            # восемь проектных документов
```

## Быстрый старт (Windows / PowerShell)

```powershell
# 1. Зависимости (root, через workspaces)
npm install

# 2. Поднять локальный PostgreSQL (embedded, не требует установки в систему)
npm run db:up

# 3. Применить миграции и загрузить демоданные
npm run db:migrate
npm run db:seed

# 4. Запустить API и Web параллельно
npm run dev
```

Web: `http://localhost:5173`. API: `http://localhost:4000/api/v1/health`.

## Скрипты

| Скрипт | Назначение |
|---|---|
| `npm run dev` | Параллельно API (4000) и Web (5173) |
| `npm run build` | Сборка обеих частей |
| `npm run test` | Vitest в `apps/api` |
| `npm run db:up` | Запустить встроенный PostgreSQL на 127.0.0.1:55432 |
| `npm run db:down` | Остановить встроенный PostgreSQL |
| `npm run db:migrate` | Применить `db/migrations/*.sql` с контролем `schema_migrations` |
| `npm run db:seed` | Загрузить идемпотентный демонабор из `db/seed` |

## Состояние разработки

См. `docs/IMPLEMENTATION_STATUS.md`. Туда вносятся статусы задач `DEV-*`, `QDB-*`, `QA-*` и блокеры.

## Безопасность и секреты

- `SERVER_OFFER_SECRET` — единственный источник секретных кодов предложений. Берётся из переменных окружения, **не** из репозитория.
- Пароли хешируются Argon2id. В БД нет открытых паролей и кодов.
- `idempotency_key` генерируется клиентом (UUIDv4) и хранится как `UNIQUE` в `offers.idempotency_key`.
- `npm run db:reset` (когда появится) запрещён на незнакомых подключениях.

## Лицензия

Внутренний учебный проект. Не предназначен для публикации без согласования.
