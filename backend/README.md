# Backend — Product management API

NestJS REST API with MongoDB to manage the product catalog: paginated listing, search, create, update and soft delete.

## Quick start

1. Start MongoDB from the repository root: `docker compose up -d`
2. Create the env file: `cp .env.example .env`
3. Install dependencies: `pnpm install`
4. Create the admin user and load the sample catalog (50 products): `pnpm seed`
5. Run the API: `pnpm dev` → http://localhost:3000

**Swagger docs:** http://localhost:3000/docs (OpenAPI JSON at `/docs-json`)

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGO_URI` | Yes | — | MongoDB connection string |
| `PORT` | No | `3000` | HTTP port |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed frontend origin |
| `JWT_SECRET` | Yes | — | Secret used to sign the access tokens |
| `JWT_EXPIRES_IN` | No | `3600s` | Token lifetime: a number plus a unit (`ms`, `s`, `m`, `h`, `d`) |
| `SEED_ADMIN_EMAIL` | For `pnpm seed` | — | Admin email, stored in lowercase |
| `SEED_ADMIN_NAME` | No | `Admin` | Admin display name (2 to 100 characters) |
| `SEED_ADMIN_PASSWORD` | No | Random | Admin password |

Demo values for a quick review:

```bash
SEED_ADMIN_EMAIL=admin@croper.test
SEED_ADMIN_NAME=Admin
SEED_ADMIN_PASSWORD=Admin1234!
```

## Commands

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Starts the API in watch mode |
| `pnpm start` | Starts the API without watch |
| `pnpm start:debug` | Starts in watch mode with the debugger attached |
| `pnpm build` | Compiles to `dist/` |
| `pnpm start:prod` | Runs the compiled build |
| `pnpm seed` | Builds, creates the admin user and inserts 50 sample products. Safe to re-run: an existing admin and existing SKUs are left untouched. Fails without creating anything when the admin config is invalid |
| `pnpm lint` | Runs oxlint with type-aware rules |
| `pnpm format` | Formats the code with Prettier |
| `pnpm test` | Runs the unit tests once (Vitest) |
| `pnpm test:watch` | Runs the unit tests in watch mode |
| `pnpm test:cov` | Runs the unit tests with coverage |
| `pnpm test:e2e` | Runs the e2e tests (requires MongoDB) |

## Endpoints

Every endpoint requires `Authorization: Bearer <accessToken>` and answers 401 without a token or with an invalid or expired one. Only the login is public.

| Method | Path | Responses | Description |
|--------|------|-----------|-------------|
| `POST` | `/auth/login` | 200, 400, 401 | Returns `accessToken`, `expiresIn` (seconds) and `user`. A wrong password and an unknown email return the same 401 "Credenciales inválidas" |
| `GET` | `/products?page=1&limit=10&search=cafe&sortBy=price&order=asc` | 200, 400 | Paginated list of active products. Search matches name or SKU, case-insensitive |
| `GET` | `/products/:id` | 200, 400, 404 | Product by id |
| `POST` | `/products` | 201, 400, 409 | Create a product. Duplicated SKU → 409 |
| `PATCH` | `/products/:id` | 200, 400, 404 | Update any field except `sku` |
| `DELETE` | `/products/:id` | 204, 400, 404 | Soft delete (`isActive: false`). The SKU can be reused afterwards |

Invalid ObjectIds and properties not declared in the DTOs return 400.

**Try it in Swagger:** call `POST /auth/login`, copy the `accessToken`, click **Authorize** and paste it. The token is kept across page reloads.

## Tech stack

| Technology | Version | Used for |
|------------|---------|----------|
| [NestJS](https://nestjs.com) | 12 | Application framework |
| [TypeScript](https://www.typescriptlang.org) | 6 | Static typing |
| [MongoDB](https://www.mongodb.com) + [Mongoose](https://mongoosejs.com) | 7 / 9 | Database and ODM (`@nestjs/mongoose`) |
| [class-validator](https://github.com/typestack/class-validator) + [class-transformer](https://github.com/typestack/class-transformer) | 0.15 / 0.5 | DTO validation and transformation |
| [@nestjs/swagger](https://docs.nestjs.com/openapi/introduction) | 12 | OpenAPI docs and Swagger UI |
| [@nestjs/config](https://docs.nestjs.com/techniques/configuration) + [Joi](https://joi.dev) | 12 / 18 | Environment variables and their validation |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | 6 | Password hashing |
| [@nestjs/jwt](https://github.com/nestjs/jwt) | 12 | Signing and verifying access tokens, global auth guard |
| [Vitest](https://vitest.dev) + [Supertest](https://github.com/ladjs/supertest) | 4 / 7 | Unit and e2e tests |
| [oxlint](https://oxc.rs) + [Prettier](https://prettier.io) | 1 / 3 | Linting and formatting |

## Project structure

```
src/
├── main.ts               # Bootstrap: CORS, ValidationPipe, Swagger
├── config/               # Env validation and database module
├── common/decorators/    # @Public() to skip the global auth guard
├── auth/                 # Login endpoint, JWT guard (APP_GUARD)
├── products/
│   ├── dto/              # Request, query and response DTOs
│   ├── schemas/          # Mongoose schema
│   ├── products.controller.ts
│   └── products.service.ts
├── users/                # User schema and service, used internally by auth (no endpoints)
└── seed/                 # Idempotent admin and product seeders
```

Requests flow **Controller (HTTP only) → Service (business logic) → Mongoose model**.
