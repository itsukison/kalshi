-- Result-feedback support: track the last time a user has "seen" their settled
-- results, so the UI can surface newly-resolved markets (的中/不的中 + payout) once.
--
-- profiles is intentionally not user-writable (only a public SELECT policy exists;
-- balances move solely through SECURITY DEFINER functions). So we expose a single
-- narrow, SECURITY DEFINER function that lets a user advance their own marker only.

alter table public.profiles
  add column if not exists results_seen_at timestamptz;

-- Advance the caller's results_seen_at marker. Monotonic: never moves backwards,
-- so a stale client cannot "unsee" results resolved after it last read them.
create or replace function public.mark_results_seen(p_seen_at timestamptz)
returns timestamptz
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_seen timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles
     set results_seen_at = greatest(coalesce(results_seen_at, '-infinity'::timestamptz), p_seen_at)
   where id = auth.uid()
  returning results_seen_at into v_seen;

  return v_seen;
end;
$$;

revoke all on function public.mark_results_seen(timestamptz) from public;
grant execute on function public.mark_results_seen(timestamptz) to authenticated;
