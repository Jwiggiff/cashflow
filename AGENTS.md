# AGENTS.md

## Cursor Cloud specific instructions

CashFlow is a single Next.js 15 (App Router) app — there is no separate backend or database server. It uses an embedded SQLite file (`data/cashflow.db`) via Prisma, and an in-process `node-cron` scheduler. Standard commands live in `package.json` (`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`); ORM/migrations are Prisma. See `README.md` for env var docs.

The startup update script already runs `npm ci` and `npx prisma generate`. Before running the app, complete these one-time-per-VM steps (they are NOT in the update script):

- **Create `.env`** (gitignored) with an auth secret, required for NextAuth to work:
  `printf 'AUTH_SECRET=%s\n' "$(openssl rand -base64 33)" > .env`
- **Create the SQLite DB** by applying migrations (creates `data/cashflow.db`, which is gitignored so it does not persist across fresh VMs):
  `npx prisma migrate deploy`

Then run the app in dev with `npm run dev` (Turbopack, http://localhost:3000).

Testing:
- `npm test` runs Vitest: `lib/**` unit tests plus `tests/db/**`, which call server actions and API routes against a throwaway SQLite DB built from `prisma/migrations` (`scripts/create-test-db.mjs`). `@/lib/auth` is mocked; use `signedInUser()`/`setSessionUser()` from `tests/db/helpers.ts`.
- `npm run test:e2e` runs Playwright (`e2e/`) against `next start` on port 3100 with its own DB in `e2e/.data/`. It needs a fresh `npm run build` first, and `npx playwright install chromium` once.
- Tests never touch `data/cashflow.db`: `lib/prisma.ts` uses `DATABASE_URL` when it is set.

Releasing:
- `main` only accepts PRs. From an up-to-date `main`, run `npm run release patch` (or `minor`/`major`). It bumps the version, prepends GitHub's generated notes to `CHANGELOG.md`, and opens a "Release vX.Y.Z" PR labeled `release` (excluded from future notes via `.github/release.yml`).
- If other PRs merge into main before the release PR, its "Release changelog" CI check fails; run `npm run release refresh` on the release branch to merge main and regenerate the entry (hand edits to it are lost).
- Edit the `CHANGELOG.md` entry in that PR if needed. Merging it runs `release.yml`, which builds and pushes the image (`latest`, `vX.Y.Z`), tags the merge commit, and creates the GitHub release from that changelog entry. Don't push tags by hand.

Non-obvious notes:
- The cron scheduler only starts when `NODE_ENV=production` AND `NEXT_RUNTIME=nodejs` (see `instrumentation.ts`); it does not run under `npm run dev`.
- There is no in-app "seed" — create the first user at `/auth/signup`, then sign in. Protected routes (`/accounts`, `/transactions`, etc.) redirect to `/auth/signin` when unauthenticated (see `proxy.ts`); the dashboard is `/`.
- Monetary values are visually masked (`$***`) in the UI by default; this is a privacy feature, not a bug.
- REST API: `POST /api/transactions` uses HTTP Basic auth (the app username/password). A referenced `category` must already exist or the request fails with "Category not found"; omit `category` to succeed.
- `OPENAI_API_KEY` (AI auto-categorization) and `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` (web push) are optional; the app logs a warning and runs fine without them.
- Husky/lint-staged run `eslint --fix` on staged JS/TS files on commit.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
