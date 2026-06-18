# ヨソウ (Yosou)

A Kalshi-style sports prediction market for Japan — played entirely with **non-redeemable points**. Users buy YES or NO contracts on real match outcomes; prices move with demand via an LMSR market maker, and correct contracts pay out 100 points each.

Points exist only for ranking, reputation, and badges. They cannot be purchased, redeemed, transferred, or exchanged for anything of real-world value.

## Features

- **Binary prediction markets** — YES/NO contracts on sports outcomes (home-win questions per match)
- **LMSR pricing** — logarithmic market scoring rule with visible slippage; buy-and-hold to settlement (no selling in MVP)
- **Points economy** — starter bonus on signup, daily login bonus, settlement payouts
- **Leaderboard** — ranked by points balance
- **Achievements** — badges for milestones (first prediction, first win, accuracy streaks, etc.)
- **Japanese-first UI** — copy, team names, and timestamps displayed in JST
- **Live sports sync** — FIFA World Cup schedules, odds-derived starting prices, and scores via [The Odds API](https://the-odds-api.com)
- **Admin settlement** — service-role routes to close markets, resolve outcomes, and cancel/refund

## How it works

1. A **match** is a real fixture (e.g. Japan vs Brazil), sourced from The Odds API or seed data.
2. Each match gets a **market** — a binary question such as "Will the home team win?"
3. Users spend points to **buy contracts** on YES or NO. The YES price (1–99) reflects crowd-implied probability.
4. Markets **close at kickoff**; trading stops.
5. After the result is confirmed, an admin **resolves** the market. Winning contracts pay 100 points; losing contracts pay 0.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth & database | [Supabase](https://supabase.com) (Postgres + Row Level Security) |
| Pricing engine | LMSR in Postgres (`buy_contract` function) |
| Sports data | The Odds API |
| Icons | [Lucide React](https://lucide.dev) |

Privileged operations (trading, settlement, cron sync) run through Next.js Route Handlers using the Supabase **service role**. Client-side Supabase access is read-only and scoped to the authenticated user's own rows.

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project with the schema migrations applied (see [Database](#database))
- Environment variables configured (see below)

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build
npm run start   # serve production build
npm run lint    # ESLint
```

### Environment variables

Create `.env.local` in the project root:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (publishable) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — admin routes, cron, and trading |
| `ADMIN_SECRET` | Shared secret for `/api/admin/*` and `/api/cron/*` (sent as `x-admin-secret` header) |
| `CRON_SECRET` | Vercel Cron secret — Vercel sends it as `Authorization: Bearer <CRON_SECRET>` to the cron routes |
| `ODDS_API_KEY` | The Odds API key — required for live World Cup sync (optional if using seed data) |

For local auth testing, disable **Confirm email** in Supabase Dashboard → Authentication → Providers → Email. Re-enable before production.

See [docs/SETUP.md](docs/SETUP.md) for curl examples and cron scheduling.

## Project structure

```
src/
├── app/
│   ├── page.tsx                 # Market browser (home)
│   ├── market/[id]/page.tsx     # Market detail + buy panel
│   ├── leaderboard/page.tsx     # Rankings
│   ├── account/page.tsx         # Profile, stats, badges
│   ├── login/page.tsx           # Sign up / sign in
│   └── api/
│       ├── markets/[id]/buy/    # Buy YES/NO contracts
│       ├── me/daily-bonus/      # Claim daily login bonus
│       ├── leaderboard/         # Leaderboard JSON
│       ├── admin/               # Seed, create, resolve, cancel
│       └── cron/                # Close markets, sync sports data
├── components/                  # UI components
├── lib/
│   ├── lmsr.ts                  # Client-side price estimates
│   ├── oddsApi.ts               # The Odds API client
│   ├── achievements.ts          # Badge definitions
│   └── supabase/                # Browser, server, and admin clients
└── middleware.ts                # Supabase session refresh
```

## API routes

### User-facing

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/markets/:id/buy` | Session | Buy YES/NO contracts |
| `POST` | `/api/me/daily-bonus` | Session | Claim daily login bonus |
| `GET` | `/api/leaderboard` | Public | Top users by balance |

### Admin / cron

All admin and cron routes require the `x-admin-secret` header.

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/admin/seed` | Seed demo World Cup matches and markets |
| `POST` | `/api/admin/markets` | Create a market manually |
| `POST` | `/api/admin/markets/:id/resolve` | Settle a closed market |
| `POST` | `/api/admin/markets/:id/cancel` | Cancel and refund a market |
| `POST` | `/api/cron/close-markets` | Close markets past kickoff |
| `POST` | `/api/cron/sync-results` | Sync World Cup schedule, odds, and scores |

Schedule `close-markets` (every minute) and `sync-results` (every few minutes) via Supabase pg_cron, Vercel Cron, or any external scheduler.

## Database

Supabase Postgres with Row Level Security. Core tables:

- `profiles` — user identity, points balance, stats
- `matches` — sports fixtures from The Odds API or seed data
- `markets` — binary YES/NO questions with LMSR state (`q_yes`, `q_no`, `b_liquidity`)
- `positions` — per-user contract holdings
- `trades` — immutable buy records
- `point_ledger_entries` — append-only point movements

Critical paths (`buy_contract`, `resolve_market`, `cancel_market`, `claim_daily_bonus`) are implemented as Postgres functions for transactional atomicity.

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/SETUP.md](docs/SETUP.md) | Environment setup, auth notes, admin curl commands |
| [docs/techprd.md](docs/techprd.md) | Technical PRD — product rules, LMSR spec, data model, legal constraints |
| [docs/design.md](docs/design.md) | Visual design system (neon playground theme) |

## Legal note

This product is designed to operate **outside Japanese gambling regulation** by using points that have no monetary value and cannot be bought, sold, transferred, or redeemed. Engineering enforces these constraints structurally — there is no code path that converts points to cash or prizes.

> This is not legal advice. Have counsel review the product constraints in [docs/techprd.md §3.1](docs/techprd.md) before launch.
