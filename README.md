# croper-test — Product management

Technical test: a product catalog manager where an admin can list, search, create, edit and delete products.

| Project | Stack | Docs |
|---------|-------|------|
| [`backend/`](backend) | NestJS, MongoDB, Mongoose, Swagger | [backend/README.md](backend/README.md) |
| [`frontend/`](frontend) | React, Vite, TanStack Query, Zustand, Zod, Tailwind | [frontend/README.md](frontend/README.md) |

## Requirements

- Node.js 22.12+
- pnpm 10+
- Docker (for MongoDB)

## Quick start

```bash
# 1. MongoDB
docker compose up -d

# 2. API → http://localhost:3000 (Swagger: http://localhost:3000/docs)
cd backend
cp .env.example .env
pnpm install
pnpm seed
pnpm dev

# 3. Web app → http://localhost:5173 (in another terminal)
cd frontend
pnpm install
pnpm dev
```

Log in with the admin created by `pnpm seed` (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `backend/.env`).

## Checks

Run in each project:

```bash
pnpm build
pnpm lint
pnpm test
```
