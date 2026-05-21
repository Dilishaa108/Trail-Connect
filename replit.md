# Trail Connect

A Nepal trekking companion platform for individuals and expedition companies to plan, book, and manage Himalayan treks with real data persistence, analytics, and emergency-ready route intelligence.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter (routing), Recharts (charts), shadcn/ui components
- API: Express 5, mounted at `/api`
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/trail-connect/` — React + Vite frontend (port 20387, preview path `/`)
- `artifacts/api-server/` — Express 5 API server (port 8080, serves `/api`)
- `lib/db/src/schema/` — Drizzle DB schema (destinations, users, guides, treks)
- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validation schemas
- `scripts/src/seed.ts` — database seed script

## Architecture decisions

- OpenAPI-first: the YAML spec is the contract; hooks and Zod schemas are generated from it via Orval — never hand-write API clients.
- Auth is stored in `localStorage` (no server sessions). Login persists the user object; all protected routes check `useAuth()`.
- Admin role check is done on the frontend via `ProtectedRoute requireAdmin`; no backend session tokens.
- Recharts powers all analytics charts (elevation profiles, monthly bookings, popular routes, difficulty breakdown).

## Product

- **Home page** — hero with live stats (destinations, users, bookings), featured expedition cards, feature highlights
- **Explore** — 15 Nepal routes with real photos, search/filter by difficulty & region, sortable grid, difficulty bar indicators
- **Destination detail** — elevation profile chart (Recharts AreaChart), day-by-day itinerary, guide cards with ratings, booking form (date + group size + guide selection), emergency contacts
- **User dashboard** — trek log with planned/completed tabs, one-click mark complete, cancel bookings
- **Admin dashboard** — analytics: monthly bookings (LineChart), popular routes (BarChart + table), difficulty breakdown (PieChart), 6-stat summary grid
- **Admin sub-pages** — destinations table (delete, view seats), guides grid (toggle availability), users table (roles, trek counts)

## Accounts

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | admin |
| alice    | alice123  | user  |
| bob      | bob123    | user  |
| sara     | sara123   | user  |

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After editing API routes, restart the `artifacts/api-server: API Server` workflow to pick up the new build.
- The API server path is `/api` (prefix included in all route handlers via `app.use("/api", router)`). Incoming URLs retain the `/api` prefix.
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before editing frontend code.
- `pnpm run typecheck` builds libs first, then checks leaf packages — always use this over editor state.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
