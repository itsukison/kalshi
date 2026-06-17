# Technical PRD: Sports Prediction Points Market (Japan)

> A Kalshi-style sports prediction game for the Japanese market, played entirely with
> non-redeemable points. Japanese-first UI, global + Japanese sports coverage.

---

## 0. Document Status & Decisions Log

This PRD supersedes the original draft. The following product/architecture decisions are locked:

| # | Decision | Choice |
|---|----------|--------|
| 1 | Pricing engine | **LMSR** (Logarithmic Market Scoring Rule) — proper slippage, bounded subsidy, solvent |
| 2 | Selling / exit | **Not supported in MVP** — buy-and-hold to settlement |
| 3 | Market outcomes | **Binary (YES/NO) now, schema designed to extend to N-way**; draw semantics defined per market |
| 4 | Sports scope | **Global + Japanese** — World Cup soccer, NBA, MLB, J.League, NPB |
| 5 | Data source | **The Odds API** (primary): schedules, results, and odds-derived starting probability |
| 6 | Legal posture | Points are **non-purchasable, non-redeemable, non-transferable** — documented as hard constraints |
| 7 | Point replenishment | **Daily login bonus** |
| 8 | Admin model | **Supabase service role only** (no per-user admin flag in MVP) |
| 9 | Localization | **Japanese-first, i18n-ready**; all timestamps stored UTC, displayed JST |

Frontend visual system: see `docs/design.md` (the "neon playground" GSAP theme). This PRD covers backend only.

---

## 1. Product Summary

Build a sports prediction market app inspired by Kalshi, but using **non-redeemable points** instead of money. Users predict sports outcomes by buying YES or NO contracts with points. Each contract resolves to **100 points if correct, 0 if incorrect**. The YES price (1–99) represents the crowd-implied probability of the event.

Points exist only for in-app ranking, reputation, and leaderboard status. **Points must never be redeemable for cash, prizes, coupons, crypto, or any real-world value, and must never be purchasable.** (See §3, Legal Constraints.)

### Tech stack

- Next.js App Router
- Supabase Auth
- Supabase Postgres (with Row Level Security)
- Privileged backend logic via **Next.js Route Handlers using the Supabase service role** (settlement, trading, sync). Postgres functions (`plpgsql`) are used where transactional atomicity is critical (the buy/settle/cancel paths).
- Supabase pg_cron (or an external scheduler hitting cron route handlers) for market closing and result syncing

---

## 2. Core Backend Concepts

Six core entities:

1. **Users / Profiles** — identity, balance, reputation stats
2. **Matches** — real sports fixtures (e.g. Japan vs Sweden), sourced from The Odds API
3. **Markets** — a binary prediction question attached to a match (e.g. "Will Japan win?")
4. **Positions** — a user's contract holdings per market/side
5. **Trades** — an immutable record of every buy
6. **Point ledger entries** — append-only record of every point movement

A **match** is a real game. A **market** is a YES/NO question about that match. Users spend points to buy YES or NO contracts. The LMSR market maker moves the YES price based on demand. When the match result is confirmed, an admin (service role) resolves the market and winning contracts pay out 100 points each.

---

## 3. Product Rules & Legal Constraints

### 3.1 Legal Constraints (HARD — non-negotiable)

These rules exist to keep the product clearly outside Japanese gambling (賭博罪, Penal Code) and payment-services (資金決済法) regulation. They are **requirements, not preferences**, and the backend must make them structurally impossible to violate:

- Points **cannot be purchased** with money or any other asset.
- Points **cannot be withdrawn** or redeemed for cash.
- Points **cannot be exchanged** for prizes, coupons, discounts, crypto, goods, or any real-world benefit.
- Points **cannot be transferred** between users.
- Points have **no monetary value** and exist solely for gameplay, ranking, and badges.

There is no code path, API route, or admin tool that converts points to anything of value. Monetization (if any) is via advertising or cosmetic items purchased with money — **never** points-for-money in either direction.

> ⚠️ This section should be reviewed by legal counsel before launch. Engineering treats it as fixed.

### 3.2 Points Rules

- New users receive a one-time **starter bonus** (default 1,000 points).
- Users receive a **daily login bonus** (default +100 points, once per JST calendar day). See §11.
- Points are earned only via settlement winnings and bonuses; lost only via trades that resolve incorrectly.

### 3.3 Market Rules

- Each market is **binary**: YES or NO (schema is designed to extend to N-way; see §6.4).
- YES price is between 1 and 99; NO price is always `100 - YES price`.
- A correct contract pays 100 points; incorrect pays 0.
- Each market has an explicit, written **resolution rule** (e.g. "YES if the home team wins in regulation or extra time; a draw resolves NO").
- Markets close at `closes_at` (typically kickoff) and trading stops.
- Markets are resolved only by trusted backend logic / service role after the real result is confirmed.

---

## 4. Sports Data Source

**Primary feed: The Odds API** (`the-odds-api.com`). One vendor covers all three needs across every target league:

| Need | Endpoint | Notes |
|------|----------|-------|
| Schedules | `GET /v4/sports/{sport_key}/events` | Returns `id`, `commence_time` (UTC), teams |
| Odds (→ starting probability) | `GET /v4/sports/{sport_key}/odds` | Decimal odds per outcome from multiple bookmakers |
| Results | `GET /v4/sports/{sport_key}/scores` | Live + recently completed scores |

### Target sport keys

| League | `sport_key` |
|--------|-------------|
| Soccer — FIFA World Cup | `soccer_fifa_world_cup` (active during tournament) |
| Soccer — J.League | `soccer_japan_j_league` |
| Basketball — NBA | `basketball_nba` |
| Baseball — MLB | `baseball_mlb` |
| Baseball — NPB | `baseball_npb` |

> ⚠️ Confirm live coverage of `soccer_japan_j_league` and `baseball_npb` in The Odds API dashboard before committing to those leagues — coverage varies by season.

### Pricing / quota

Free tier = 500 credits/month (too low for production). **Pro ≈ $29/mo, 20,000 requests.** Cost = 1 credit per `sport_key` per `region` per `/odds` or `/scores` call. The sync cron must batch by sport key and cache aggressively to stay within quota (see §10).

### Deriving the starting YES price from odds

Bookmaker odds embed a margin ("vig"), so raw implied probabilities sum to >100%. The backend must normalize:

```ts
// For a market outcome with decimal odds for each possible result:
const implied = outcomes.map(o => 1 / o.decimalOdds);     // raw implied probs
const overround = implied.reduce((a, b) => a + b, 0);      // > 1.0
const fair = implied.map(p => p / overround);              // normalized to sum 1.0

// YES price (1–99) = fair probability of the YES outcome, scaled and clamped
const yesProbability = fair[indexOfYesOutcome];            // 0..1
initial_yes_price = clamp(Math.round(yesProbability * 100), 1, 99);
```

This produces a market-calibrated starting price instead of a hand-picked guess. If odds are unavailable for a fixture, fall back to a configured default (e.g. 50) and flag the market for admin review.

---

## 5. Pricing Logic — LMSR

The MVP uses the **Logarithmic Market Scoring Rule (LMSR)**, the standard automated market maker for prediction markets. It gives realistic slippage (large buys move the price and cost more per contract) and — critically — a **bounded maximum subsidy**, which keeps point inflation finite and the economy solvent.

### 5.1 State

Each market tracks two share quantities instead of a single ad-hoc volume:

- `q_yes` — total YES contracts ever minted
- `q_no` — total NO contracts ever minted
- `b_liquidity` — the liquidity parameter (larger = more stable prices, smaller = more volatile)

Work internally in **share units where each share pays out 1 unit; 1 unit = 100 points.** All point amounts are therefore `units × 100`.

### 5.2 Core formulas

Cost function:
```
C(q_yes, q_no) = b · ln( e^(q_yes/b) + e^(q_no/b) )      // in units
```

Instantaneous YES price (a probability in 0..1):
```
p_yes = e^(q_yes/b) / ( e^(q_yes/b) + e^(q_no/b) )
yes_price (1..99) = clamp(round(p_yes · 100), 1, 99)
```

**Cost to buy Δ contracts** of a side = `C(after) − C(before)` (in units, ×100 for points).

### 5.3 Inverting cost → contracts (what the buy function actually does)

The user submits `pointsSpent`, not a contract count. We solve for the number of contracts Δ that exactly cost `pointsSpent`. Closed form (buying YES; symmetric for NO):

```
units   = pointsSpent / 100
S       = e^(q_yes/b) + e^(q_no/b)
Δ_yes   = b · ln( e^(units/b) · S − e^(q_no/b) ) − q_yes
```

Then update `q_yes += Δ_yes`, recompute `p_yes`, and store the new `yes_price`. For NO buys, swap the roles of `q_yes`/`q_no`.

### 5.4 Initialization from starting probability

Given a target starting probability `p0` (from §4), seed the market with `q_no = 0` and:
```
q_yes = b · ln( p0 / (1 − p0) )
```
This makes `p_yes = p0` exactly at open.

### 5.5 Solvency guarantee

For a binary LMSR market, the maximum net points the "house" can pay out beyond what was collected is bounded by:
```
max_subsidy_points = 100 · b · ln(2)
```
This is the key property the original additive formula lacked: total payouts can never run away. Choose `b` per market to tune both volatility and worst-case subsidy.

### 5.6 Choosing `b`

- Smaller `b` (e.g. 50–150 units) → exciting, volatile prices, small subsidy.
- Larger `b` (e.g. 300–1000 units) → stable, liquid-feeling prices, larger subsidy.
- Default for MVP: `b = 150` units, tuned per market based on expected volume.

### 5.7 Worked example

```
b = 150, starting p0 = 0.40  → q_yes = 150·ln(0.4/0.6) ≈ -60.82, q_no = 0
User spends 1000 points on YES → units = 10
S = e^(-60.82/150) + e^(0) = e^(-0.405) + 1 ≈ 0.667 + 1 = 1.667
Δ_yes = 150·ln( e^(10/150)·1.667 − 1 ) − (-60.82)
      = 150·ln( 1.069·1.667 − 1 ) + 60.82
      = 150·ln(0.782) + 60.82 ≈ 150·(-0.2459) + 60.82 ≈ 23.9 contracts
New q_yes ≈ -36.9 → new p_yes ≈ 0.46 → yes_price ≈ 46
If YES resolves correctly: payout = 23.9 × 100 ≈ 2,390 points (profit ≈ 1,390)
```

Note the contracts received (≈23.9) are **fewer** than the naive `1000/40 = 25`, because the price moved against the buyer during the purchase — that is the slippage the original spec was missing.

### 5.8 Implementation notes

- All pricing math runs **server-side only** inside the buy transaction. The client may show an estimate but never decides the final price or contract count.
- Use `numeric` for storage; perform `exp`/`ln` in the application layer or `plpgsql` with `double precision`, then round/store as `numeric`. Guard against overflow by keeping `q/b` in a sane range (the clamp on price plus reasonable `b` values keep exponents small).

---

## 6. Database Schema

All tables have RLS enabled (§13). All timestamps are `timestamptz` stored in UTC.

### 6.1 profiles

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  points_balance numeric not null default 1000,
  total_points_earned numeric not null default 0,
  total_points_lost numeric not null default 0,
  prediction_count integer not null default 0,
  correct_prediction_count integer not null default 0,
  last_daily_bonus_date date,                       -- JST date of last claim (see §11)
  locale text not null default 'ja',                -- i18n-ready
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 6.2 matches

```sql
create table matches (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,                          -- The Odds API event id
  sport_key text not null,                          -- e.g. 'basketball_nba'
  sport text not null default 'soccer',             -- coarse category for grouping
  league text,                                      -- display label, e.g. 'J.League'
  home_team text not null,
  away_team text not null,
  home_score integer,
  away_score integer,
  status text not null default 'scheduled',
  kickoff_at timestamptz not null,                  -- UTC; display in JST
  finished_at timestamptz,
  source text default 'the-odds-api',
  raw_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint valid_match_status
    check (status in ('scheduled','live','finished','cancelled','postponed'))
);
```

### 6.3 markets

```sql
create table markets (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  question text not null,                           -- Japanese, e.g. '日本は勝ちますか？'
  question_en text,                                 -- optional English (i18n-ready)
  market_type text not null default 'binary',
  resolution_rule text not null,                    -- explicit, e.g. draw → NO
  status text not null default 'open',

  -- LMSR state
  b_liquidity numeric not null default 150,
  q_yes numeric not null default 0,
  q_no numeric not null default 0,
  yes_price numeric not null,                       -- derived from LMSR, stored for fast reads
  no_price numeric generated always as (100 - yes_price) stored,
  initial_yes_price numeric not null,

  closes_at timestamptz not null,
  resolved_outcome text,
  resolved_at timestamptz,
  settlement_source text,
  ready_for_review boolean not null default false,  -- set by sync cron (§10)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint yes_price_range check (yes_price >= 1 and yes_price <= 99),
  constraint valid_status check (status in ('open','closed','resolved','cancelled')),
  constraint valid_resolved_outcome
    check (resolved_outcome in ('YES','NO') or resolved_outcome is null)
);
```

`status` values: `open` (trading), `closed` (trading stopped, awaiting result), `resolved` (paid out), `cancelled` (voided + refunded).

### 6.4 N-way extensibility (future, not built in MVP)

Binary is implemented with the columns above. To extend to categorical markets (e.g. home/draw/away) later, add a `market_outcomes` table (`market_id`, `label`, `q`, `price`, `is_winner`) and set `market_type = 'categorical'`, generalizing the LMSR state from two quantities to a vector. MVP code paths assume binary; the `market_type` discriminator is the seam.

### 6.5 positions

No selling in MVP, so realized P&L and average price are dropped (derivable from `total_cost / contracts` when needed for display).

```sql
create table positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  market_id uuid references markets(id) on delete cascade,
  side text not null,
  contracts numeric not null default 0,
  total_cost numeric not null default 0,            -- total points spent on this side
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint valid_side check (side in ('YES','NO')),
  unique (user_id, market_id, side)
);
```

### 6.6 trades

```sql
create table trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  market_id uuid references markets(id) on delete cascade,
  side text not null,
  points_spent numeric not null,
  contracts_bought numeric not null,
  avg_price numeric not null,                        -- points_spent / contracts_bought
  yes_price_before numeric not null,
  yes_price_after numeric not null,
  created_at timestamptz not null default now(),

  constraint valid_trade_side check (side in ('YES','NO'))
);
```

### 6.7 point_ledger

Append-only. **Never change `points_balance` without inserting a ledger row in the same transaction.**

```sql
create table point_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  market_id uuid references markets(id) on delete set null,
  trade_id uuid references trades(id) on delete set null,
  amount numeric not null,                           -- signed: negative = spend
  type text not null,
  description text,
  created_at timestamptz not null default now(),

  constraint valid_ledger_type check (type in
    ('starter_bonus','daily_bonus','trade_spend','settlement_win','refund','admin_adjustment'))
);
```

### 6.8 updated_at maintenance

Add a shared trigger to keep `updated_at` current on `profiles`, `matches`, `markets`, `positions`:

```sql
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
-- attach: create trigger ... before update on <table>
--         for each row execute function set_updated_at();
```

---

## 7. Buy Contract Flow

Privileged path. Implemented as a Postgres function `buy_contract(...)` called by `POST /api/markets/:id/buy` (service role), or directly as an RPC with `security definer`.

Input:
```ts
{ marketId: string; side: "YES" | "NO"; pointsSpent: number; }
```

Validation:
1. User authenticated.
2. Market exists and `status = 'open'`.
3. `now() < closes_at`.
4. `pointsSpent` positive (and ≥ a configured minimum, e.g. 1).
5. User has sufficient balance.
6. Side ∈ {YES, NO}.

Transaction (single DB transaction, with row locks):
1. `SELECT ... FOR UPDATE` the user's `profiles` row.
2. `SELECT ... FOR UPDATE` the `markets` row.
3. Re-check status, `closes_at`, and balance **inside** the lock.
4. Read `q_yes`, `q_no`, `b_liquidity`.
5. Compute `Δ contracts` via the LMSR inversion (§5.3).
6. Compute new `q_*` and new `yes_price`.
7. Deduct `pointsSpent` from `points_balance`.
8. Insert `trades` row.
9. Upsert `positions` row (`contracts += Δ`, `total_cost += pointsSpent`).
10. Insert `point_ledger` row, `type = 'trade_spend'`, `amount = -pointsSpent`.
11. Update market `q_*`, `yes_price`, `updated_at`.
12. Increment `profiles.prediction_count` (count distinct markets, or per-trade — see §14).
13. Return updated market, trade, and position.

Rules: must be one transaction; the client only sends marketId/side/pointsSpent; the backend alone computes price and contracts.

---

## 8. Settlement Flow

Privileged path: `resolve_market(...)`, called by `POST /api/admin/markets/:id/resolve` (service role only).

Input:
```ts
{ marketId: string; outcome: "YES" | "NO"; settlementSource?: string; }
```

Validation:
1. Caller is service role.
2. Market exists.
3. Market `status = 'closed'` (not already `resolved`).
4. Outcome ∈ {YES, NO}.

Transaction:
1. `SELECT ... FOR UPDATE` the market row; re-check it is `closed`/unresolved (prevents double settlement).
2. Load all positions for the market.
3. For each **winning-side** position:
   - `payout = contracts × 100`
   - `points_balance += payout`
   - insert ledger row, `type = 'settlement_win'`, `amount = +payout`
   - `total_points_earned += payout`; `correct_prediction_count += 1`
4. For each **losing-side** position:
   - no payout
   - `total_points_lost += total_cost` (book the loss for stats)
5. Set `status = 'resolved'`, `resolved_outcome`, `resolved_at`, `settlement_source`.

Idempotency: because step 1 locks and re-checks status, a second call after `resolved` is rejected.

---

## 9. Market Closing Flow

Cron `close_expired_markets()` (every minute) via `POST /api/cron/close-markets`:
1. Find markets where `status = 'open'` AND `closes_at <= now()`.
2. Set `status = 'closed'`.
3. No further trading allowed (enforced by §7 validation).

---

## 10. Match Result Sync

Cron `sync_match_results()` via `POST /api/cron/sync-results`. Batches calls to The Odds API by `sport_key` to conserve credits (§4).

1. Fetch upcoming/live/recent events, odds, and scores per active `sport_key`.
2. Upsert `matches` (status, scores, `raw_data`).
3. When a match is finished, set `status = 'finished'`, `finished_at`.
4. Find unresolved markets on that match.
5. If the outcome can be determined from the score per the market's `resolution_rule`, **do not auto-settle** — set `markets.ready_for_review = true` and store the suggested outcome in `raw_data`/`settlement_source`.
6. An admin confirms via the resolve endpoint (§8).

Reason: sports APIs can be delayed or wrong; manual confirmation protects high-volume markets. Auto-settle may be added later for low-risk markets.

---

## 11. Daily Login Bonus & Replenishment

`claim_daily_bonus()` via an authenticated route (`POST /api/me/daily-bonus`):
1. Compute today's JST date (`(now() at time zone 'Asia/Tokyo')::date`).
2. If `profiles.last_daily_bonus_date` = today's JST date → reject (already claimed).
3. Else, in one transaction: `points_balance += 100`, set `last_daily_bonus_date`, insert ledger row `type = 'daily_bonus'`, `amount = +100`.

This guarantees no user is ever permanently stuck at 0 points. Amount is configurable. (Starter bonus is granted once on profile creation, `type = 'starter_bonus'`.)

---

## 12. Refund / Cancel Flow

`cancel_market(marketId)` via `POST /api/admin/markets/:id/cancel` (service role only):
1. Service role only.
2. Market not already `resolved`.
3. Sum each user's net spend on the market from `trades` (or `positions.total_cost`).
4. Refund each user's total `points_spent` for that market: `points_balance += refund`.
5. Insert ledger rows `type = 'refund'`, `amount = +refund`.
6. Set `status = 'cancelled'`.

Used when a match is cancelled, postponed too long, or a market was created in error.

---

## 13. API Routes

```txt
GET  /api/matches
GET  /api/matches/:id
GET  /api/markets
GET  /api/markets/:id
POST /api/markets/:id/buy            # auth user → buy_contract
POST /api/me/daily-bonus             # auth user → claim_daily_bonus
GET  /api/leaderboard
POST /api/admin/markets/:id/resolve  # service role
POST /api/admin/markets/:id/cancel   # service role
POST /api/admin/markets              # service role → create market from a match
POST /api/cron/close-markets         # cron / service role
POST /api/cron/sync-results          # cron / service role
```

The client must **never** directly write `profiles.points_balance`, `markets` (price/state), `positions`, `trades`, or `point_ledger`. All writes go through backend functions.

---

## 14. Supabase RLS Rules

Enable RLS on all tables. Privileged writes use the service role, which bypasses RLS.

- **profiles**: anyone can read public fields (username, display_name, avatar_url, stats); users can read their own full row; users **cannot** update `points_balance`, stats, or `last_daily_bonus_date` (no client UPDATE policy on those; profile edits limited to display_name/avatar_url/username).
- **matches**: public read.
- **markets**: public read.
- **positions**: users read their own rows only; no client insert/update/delete.
- **trades**: users read their own rows only; no client insert.
- **point_ledger**: users read their own rows only; no client insert.
- **service role**: performs all settlement, cancellation, sync, market creation, and adjustments.

---

## 15. Leaderboard Logic

Default ranking by `points_balance`, with accuracy and a derived net-profit view exposed as alternates.

```sql
select
  id, username, display_name, avatar_url,
  points_balance,
  (total_points_earned - total_points_lost) as net_profit,
  prediction_count,
  correct_prediction_count,
  case when prediction_count = 0 then 0
       else correct_prediction_count::numeric / prediction_count end as accuracy
from profiles
order by points_balance desc
limit 100;
```

`prediction_count` / `correct_prediction_count` are incremented per resolved position (one settled market = one prediction outcome), so accuracy reflects markets, not individual buys.

Later: weekly leaderboard, sport-specific, "Japan expert" / "underdog hunter" badges.

---

## 16. Example User Flow

1. User signs up → receives 1,000 starter points (`starter_bonus`).
2. User opens the Japan vs Sweden match page (times shown in JST).
3. User sees the market 「日本は勝ちますか？」(Will Japan win?). Starting YES price 40, derived from normalized bookmaker odds.
4. User spends 1,000 points on YES.
5. Backend (LMSR) computes ≈23.9 contracts, deducts 1,000 points, moves YES price up to ≈46.
6. Market closes at kickoff (`closed`).
7. Japan wins. Sync cron flags the market `ready_for_review` with suggested outcome YES.
8. Admin confirms → market `resolved`, outcome YES.
9. User receives ≈23.9 × 100 ≈ 2,390 points (`settlement_win`); stats updated.
10. User rises on the leaderboard.

---

## 17. MVP Implementation Priority

**Phase 1 — Core economy**
- Supabase Auth + profiles (starter bonus on signup)
- Matches + markets schema, RLS, updated_at triggers
- LMSR `buy_contract` function + buy route
- Point ledger
- Daily login bonus
- Basic leaderboard

**Phase 2 — Lifecycle**
- Market closing cron
- Admin resolve + cancel/refund
- User positions page

**Phase 3 — Data integration**
- The Odds API client (events, odds→starting price, scores)
- Sync cron + `ready_for_review` flagging
- Admin review panel
- Market creation from synced matches

**Phase 4 — Polish**
- LMSR `b` tuning per market
- Price-history charts
- Weekly / sport-specific leaderboards
- Badges & reputation
- N-way categorical markets (§6.4)
- Japanese localization pass + (optional) English

---

## 18. Engineering Notes

- **Money-free by construction**: there is no points↔value conversion anywhere (§3.1).
- **Never trust the client** for prices or contracts; the backend is authoritative (§5.8).
- **Use transactions** for: buying, settling, cancelling, daily bonus, admin adjustments.
- **Prevent double settlement**: check `status` inside the locked transaction; reject if already `resolved` (§8).
- **Prevent overspending**: lock the profile row and check balance inside the transaction (§7).
- **Prevent trading after close**: check both `markets.status` and `closes_at` (§7, §9).
- **Numeric precision**: store points/contracts as `numeric`; do `exp`/`ln` in `double precision` then round. Display values may be rounded in the UI.
- **Timezones**: store UTC, display JST; daily-bonus eligibility uses the JST calendar day (§11).
- **i18n**: user-facing strings (incl. `markets.question`) authored in Japanese first; schema carries optional English fields and a `locale` for future expansion.
- **Anti-abuse (later)**: consider rate limits and sybil detection before any public ranking has stakes attached to reputation.

---

## 19. Claude Code Task

Implement the backend MVP with Next.js App Router + Supabase: database schema/migrations, RLS policies, and the privileged functions/route handlers for buying contracts (LMSR), closing markets, resolving markets, cancelling/refunding markets, claiming the daily bonus, and reading the leaderboard. Build The Odds API sync (Phase 3) with odds-derived starting prices. Prioritize correctness, transaction safety, solvency, and the legal constraints in §3.1 over UI polish. The frontend must never directly mutate points, markets, trades, positions, or ledger rows.
