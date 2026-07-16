# AGENTS.md

## Cursor Cloud specific instructions

CashFlow is a single Next.js 15 (App Router) app — there is no separate backend or database server. It uses an embedded SQLite file (`data/cashflow.db`) via Prisma, and an in-process `node-cron` scheduler. Standard commands live in `package.json` (`dev`, `build`, `start`, `lint`); ORM/migrations are Prisma. See `README.md` for env var docs.

The startup update script already runs `npm ci` and `npx prisma generate`. Before running the app, complete these one-time-per-VM steps (they are NOT in the update script):

- **Create `.env`** (gitignored) with an auth secret, required for NextAuth to work:
  `printf 'AUTH_SECRET=%s\n' "$(openssl rand -base64 33)" > .env`
- **Create the SQLite DB** by applying migrations (creates `data/cashflow.db`, which is gitignored so it does not persist across fresh VMs):
  `npx prisma migrate deploy`

Then run the app in dev with `npm run dev` (Turbopack, http://localhost:3000).

Non-obvious notes:
- The cron scheduler only starts when `NODE_ENV=production` AND `NEXT_RUNTIME=nodejs` (see `instrumentation.ts`); it does not run under `npm run dev`.
- There is no in-app "seed" — create the first user at `/auth/signup`, then sign in. Protected routes (`/dashboard`, `/accounts`, `/transactions`, etc.) redirect to `/auth/signin` when unauthenticated (see `middleware.ts`).
- Monetary values are visually masked (`$***`) in the UI by default; this is a privacy feature, not a bug.
- REST API: `POST /api/transactions` uses HTTP Basic auth (the app username/password). A referenced `category` must already exist or the request fails with "Category not found"; omit `category` to succeed.
- `OPENAI_API_KEY` (AI auto-categorization) and `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` (web push) are optional; the app logs a warning and runs fine without them.
- Husky/lint-staged run `eslint --fix` on staged JS/TS files on commit.
