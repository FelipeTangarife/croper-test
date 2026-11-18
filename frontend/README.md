# Frontend — Product management

React + Vite app to log in and list, search, create, edit and delete products against the NestJS API in `../backend`.

## Quick start

1. Start MongoDB and the API (see `../backend`): `docker compose up -d`, then `pnpm seed` and `pnpm dev` inside `backend/`.
2. Install dependencies: `pnpm install`
3. Run the app: `pnpm dev` → http://localhost:5173
4. Log in with the admin from the backend `.env` (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

The API URL defaults to `http://localhost:3000`. Override it with a `.env` file:

```bash
VITE_API_URL=http://localhost:3000
```

## Commands

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Starts the Vite dev server with hot reload |
| `pnpm build` | Type-checks (`tsc -b`) and builds for production into `dist/` |
| `pnpm preview` | Serves the production build locally |
| `pnpm lint` | Runs ESLint |
| `pnpm test` | Runs the test suite once (Vitest) |
| `pnpm test:watch` | Runs the tests in watch mode |

## Routes and session

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Without a session | Login form. With a session it redirects to `/products` |
| `/products` | With a session | Products management. Without a session it redirects to `/login` |

- The token, the user and the expiration date are persisted in a Zustand store (`localStorage`), so a reload keeps the session until the token expires.
- An Axios interceptor adds `Authorization: Bearer <token>` to every request. A 401 from the API logs out and shows "Tu sesión expiró, vuelve a ingresar" on the login.
- The session also ends on its own when the token expires, even without new requests.
- A 429 from the API shows "Demasiados intentos, espera un minuto": inline on the login, as a toast everywhere else.

## Tech stack

| Technology | Version | Used for |
|------------|---------|----------|
| [React](https://react.dev) | 19 | UI |
| [TypeScript](https://www.typescriptlang.org) | 6 | Static typing |
| [Vite](https://vite.dev) | 8 | Dev server and bundler |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Styling, responsive table/cards layout |
| [shadcn/ui](https://ui.shadcn.com) + [Base UI](https://base-ui.com) | — | Accessible UI primitives (dialog, alert dialog, select, table) |
| [TanStack Query](https://tanstack.com/query) | 5 | Server state: fetching, caching, mutations and invalidation |
| [Zustand](https://zustand.docs.pmnd.rs) | 5 | Session (persisted in `localStorage`) and listing state (persisted in the URL) |
| [React Router](https://reactrouter.com) | 8 | Routes and route guards |
| [React Hook Form](https://react-hook-form.com) | 7 | Login and create/edit product forms |
| [Zod](https://zod.dev) | 4 | Form validation, same rules as the backend DTOs |
| [Axios](https://axios-http.com) | 1 | HTTP client |
| [Sonner](https://sonner.emilkowal.ski) | 2 | Success and error toasts |
| [Lucide](https://lucide.dev) | — | Icons |
| [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) | 5 / 16 | Unit and integration tests on jsdom |

## Project structure

```
src/
├── app/                  # App root, providers, routes and layout
├── lib/                  # Axios instance and QueryClient
├── features/
│   ├── auth/             # Login page, session store, Axios interceptors, route guards
│   └── products/
│       ├── api/          # HTTP calls
│       ├── hooks/        # TanStack Query hooks
│       ├── store/        # Zustand store synced with the URL
│       ├── schemas/      # Zod form schema and payload mapping
│       ├── utils/        # Price formatting and error messages
│       └── components/   # Page, table, cards, dialogs and states
├── shared/               # Reusable UI components and hooks
└── test/                 # Test setup
```

Data flows **Component → Hook → API**: components never call Axios directly.
