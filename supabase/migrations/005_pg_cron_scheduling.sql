-- Scheduling that runs inside Postgres, independent of Vercel's cron-frequency
-- limits (Vercel Hobby only allows once-daily cron; pg_cron runs every minute).
--
-- Apply via Supabase MCP/SQL editor, then set the two Vault secrets below
-- (see docs/SETUP.md → "Scheduling on Vercel Hobby (pg_cron)").

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1) close-markets: pure SQL, no external call. Stops trading on markets past kickoff.
select cron.schedule(
  'close-markets',
  '* * * * *',
  $$
    update public.markets
       set status = 'closed'
     where status = 'open'
       and closes_at <= now();
  $$
);

-- 2) sync-results: needs The Odds API + the app's settlement logic, so call the
--    deployed Next.js route asynchronously via pg_net. URL + secret come from Vault
--    so no secrets live in the job body. Inert (logs a notice) until they are set.
create or replace function public.cron_sync_results()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'app_base_url';
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'cron_admin_secret';

  if v_url is null or v_url = '' then
    raise notice 'cron_sync_results: vault secret app_base_url not set; skipping';
    return;
  end if;

  perform net.http_post(
    url := rtrim(v_url, '/') || '/api/cron/sync-results',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-admin-secret', coalesce(v_secret, '')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
end;
$$;

select cron.schedule(
  'sync-results',
  '*/15 * * * *',
  $$ select public.cron_sync_results(); $$
);

-- ---------------------------------------------------------------------------
-- AFTER applying, set these once (replace the values), so sync-results can
-- reach your deployed app. Re-run with UPDATE semantics if they already exist.
--
--   select vault.create_secret('https://YOUR-APP.vercel.app', 'app_base_url');
--   select vault.create_secret('YOUR_PROD_ADMIN_SECRET',      'cron_admin_secret');
--
-- To change later:
--   select vault.update_secret(
--     (select id from vault.secrets where name='app_base_url'),
--     'https://new-url.vercel.app');
-- ---------------------------------------------------------------------------
