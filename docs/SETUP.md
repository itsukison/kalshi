# Setup & Run

Next.js (App Router) + Supabase prediction-market MVP. World Cup markets, points-only.

## 1. Environment variables (`.env.local`)

Already created with the public values. Fill in the secrets:

| Var | Where to get it | Needed for |
|-----|-----------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ set | everything |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ set (publishable key) | everything |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → `service_role` (secret) | admin + cron + seed routes |
| `ADMIN_SECRET` | choose any strong string | guards `/api/admin/*` and `/api/cron/*` (send as `x-admin-secret` header) |
| `ODDS_API_KEY` | the-odds-api.com (Pro ≈ $29/mo) | live World Cup sync (optional; demo data already seeded) |

## 2. Run

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
```

## 3. Auth note (for local testing)

Signup uses email + password. By default Supabase requires email confirmation, so
`signInWithPassword` only works after the user clicks the confirmation link.
For fast local testing: Supabase Dashboard → Authentication → Providers → Email →
disable "Confirm email". (Re-enable before production.)

## 4. Admin / cron usage

All protected by the `x-admin-secret` header.

```bash
# seed demo data (idempotent) — already seeded via MCP, but the route also works:
curl -X POST localhost:3000/api/admin/seed -H "x-admin-secret: $ADMIN_SECRET"

# close markets past kickoff
curl -X POST localhost:3000/api/cron/close-markets -H "x-admin-secret: $ADMIN_SECRET"

# pull World Cup schedules/odds/scores (needs ODDS_API_KEY)
curl -X POST localhost:3000/api/cron/sync-results -H "x-admin-secret: $ADMIN_SECRET"

# resolve a market (after it is 'closed')
curl -X POST localhost:3000/api/admin/markets/<id>/resolve \
  -H "x-admin-secret: $ADMIN_SECRET" -H "content-type: application/json" \
  -d '{"outcome":"YES","settlementSource":"admin"}'

# cancel + refund
curl -X POST localhost:3000/api/admin/markets/<id>/cancel -H "x-admin-secret: $ADMIN_SECRET"
```

Schedule `close-markets` (every minute) and `sync-results` (every few minutes) via
Supabase pg_cron, Vercel Cron, or any external scheduler hitting those routes with the header.

## 5. What's in the database (Supabase project `nytaydyjxzgvdaxgzaau`)

Migrations applied via MCP:
- `001_core_schema` — tables, constraints, `updated_at` triggers, signup→profile+starter-bonus trigger
- `002_rls_policies` — RLS on; read-only client access scoped to own rows; no client writes
- `003_functions` — `buy_contract` (LMSR), `resolve_market`, `cancel_market`, `claim_daily_bonus`, `update_my_profile` + execute grants
- `004_harden_functions` — pinned search_path, locked down trigger function

## 6. Known follow-ups

- `src/middleware.ts` works but Next 16 deprecates the name in favor of `proxy.ts` — migrate later.
- Confirm The Odds API live coverage of `soccer_fifa_world_cup` before relying on sync.
- Legal review of the points constraints (PRD §3.1) before launch.
