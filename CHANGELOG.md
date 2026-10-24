# Changelog

## v0.1.25 (2026-10-24)

### What's Changed
#### Dependencies
* Bump the npm-deps group across 1 directory with 18 updates by @dependabot[bot] in https://github.com/Jwiggiff/cashflow/pull/59
* Bump the actions-deps group across 1 directory with 4 updates by @dependabot[bot] in https://github.com/Jwiggiff/cashflow/pull/61
* Bump source-map-js from 1.2.1 to 1.2.2 by @dependabot[bot] in https://github.com/Jwiggiff/cashflow/pull/58
* Bump vitest from 3.2.7 to 4.1.11 by @dependabot[bot] in https://github.com/Jwiggiff/cashflow/pull/56
* Bump lucide-react from 0.522.0 to 1.57.0 by @dependabot[bot] in https://github.com/Jwiggiff/cashflow/pull/65
* Bump node from 24-alpine to 26-alpine in the docker-deps group across 1 directory by @dependabot[bot] in https://github.com/Jwiggiff/cashflow/pull/48
* Bump the npm-deps group with 2 updates by @dependabot[bot] in https://github.com/Jwiggiff/cashflow/pull/69
* Bump @types/node from 20.19.1 to 26.6.5 by @dependabot[bot] in https://github.com/Jwiggiff/cashflow/pull/77
* Bump eslint from 9.39.5 to 10.12.0 by @dependabot[bot] in https://github.com/Jwiggiff/cashflow/pull/75
* Bump lucide-react from 1.57.0 to 1.58.0 in the npm-deps group by @dependabot[bot] in https://github.com/Jwiggiff/cashflow/pull/83
* Bump vitest from 4.1.11 to 5.0.5 by @dependabot[bot] in https://github.com/Jwiggiff/cashflow/pull/85
* Bump lint-staged from 16.1.2 to 17.6.0 by @dependabot[bot] in https://github.com/Jwiggiff/cashflow/pull/86
* Bump react-day-picker from 9.7.0 to 10.0.2 by @dependabot[bot] in https://github.com/Jwiggiff/cashflow/pull/87
#### Changes
* Add Claude PR review workflow by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/34
* Update Node from 22 to 24 LTS by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/35
* Fix stale recurring-transaction suggestions and backdated first occurrence by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/38
* Hide "Uncategorized" label for income on mobile transaction list by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/39
* Upgrade to Next.js 16 by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/36
* Fix /dashboard 404 and CSV import dates; add passkey e2e test by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/37
* Auto-trigger passkey sign-in when launched as an installed PWA by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/44
* Stop re-running Claude PR review on every push by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/45
* Fix passkey sign-out loop, add missing auto-signin e2e coverage by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/46
* Add ephemeral per-PR preview deploys via Fly.io by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/55
* Add pull-to-refresh for installed PWA mode by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/54
* Downgrade React Compiler hook lint rules to warnings by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/60
* Refactor effects flagged by React Compiler hook lint rules by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/62
* Link recurring transfer notifications to /transactions by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/63
* Group npm security updates into one Dependabot PR by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/64
* Fix seeded category icons not rendering by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/66
* Ignore major @simplewebauthn updates until Auth.js supports them by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/67
* Install the lockfile's Prisma CLI version in the Docker image by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/68
* Ignore major Prisma updates until the v7 migration is done by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/74
* Speed up PR CI, fix cancelled Claude reviews, add commenting guidance by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/78
* Upgrade zod to v4 by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/80
* Upgrade @tanstack/react-table to v9 by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/82
* Check Dependabot npm updates monthly by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/79
* Upgrade recharts to v3 by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/81
* Fix expense pie colours and clipped Monthly Overview axis by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/88
* Cascade-delete accounts with a confirmation showing what's affected by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/47

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.24...v0.1.25

## v0.1.24 (2026-09-27)

### What's Changed
#### Changes
* Add CI workflow with lint, typecheck, tests, and builds by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/29
* Add database and browser tests; fix cross-user data access by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/31
* Add PR-based release flow with generated changelog by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/32

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.23...v0.1.24

## v0.1.23 (2026-09-27)

### What's Changed
* Bump vulnerable dependencies (Next.js, Auth.js, Prisma) by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/6
* Create dependabot.yml by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/9
* Add dependency groups for npm, docker, and actions by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/21
* Update npm-deps configuration in dependabot.yml by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/24
* Bump the actions-deps group across 1 directory with 6 updates by @dependabot[bot] in https://github.com/Jwiggiff/cashflow/pull/22
* Bump the npm-deps group across 1 directory with 27 updates by @dependabot[bot] in https://github.com/Jwiggiff/cashflow/pull/25
* Add shift-click range selection to transactions table by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/26
* Fix production build warnings by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/27

### New Contributors
* @dependabot[bot] made their first contribution in https://github.com/Jwiggiff/cashflow/pull/22

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.22...v0.1.23

## v0.1.22 (2026-08-15)

### What's Changed
* Set up Cursor Cloud dev environment by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/3
* Add account balance and net worth history charts by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/2
* Polish mobile UX across app pages by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/4


**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.21...v0.1.22

## v0.1.21 (2026-06-16)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.20...v0.1.21

## v0.1.20 (2026-04-25)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.19...v0.1.20

## v0.1.19 (2026-04-07)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.18...v0.1.19

## v0.1.18 (2026-03-31)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.17...v0.1.18

## v0.1.17 (2026-03-31)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.16...v0.1.17

## v0.1.16 (2026-03-10)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.15...v0.1.16

## v0.1.15 (2026-03-02)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.14...v0.1.15

## v0.1.14 (2026-02-22)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.13...v0.1.14

## v0.1.13 (2026-01-31)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.12...v0.1.13

## v0.1.12 (2025-12-29)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.11...v0.1.12

## v0.1.11 (2025-11-24)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.10...v0.1.11

## v0.1.10 (2025-09-30)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.9...v0.1.10

## v0.1.9 (2025-09-28)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.8...v0.1.9

## v0.1.8 (2025-09-18)

### What's Changed
* Add recurring transactions & transfers by @Jwiggiff in https://github.com/Jwiggiff/cashflow/pull/1

### New Contributors
* @Jwiggiff made their first contribution in https://github.com/Jwiggiff/cashflow/pull/1

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.7...v0.1.8

## v0.1.7 (2025-07-21)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.6...v0.1.7

## v0.1.6 (2025-07-16)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.5...v0.1.6

## v0.1.5 (2025-07-08)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.4...v0.1.5

## v0.1.4 (2025-07-07)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.3...v0.1.4

## v0.1.3 (2025-07-07)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.2...v0.1.3

## v0.1.2 (2025-07-06)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.1...v0.1.2

## v0.1.1 (2025-07-06)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/compare/v0.1.0...v0.1.1

## v0.1.0 (2025-07-06)

**Full Changelog**: https://github.com/Jwiggiff/cashflow/commits/v0.1.0
