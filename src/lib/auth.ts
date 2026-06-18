import { NextRequest } from "next/server";

/** Guards admin/cron routes with a shared secret sent via the `x-admin-secret` header. */
export function requireAdminSecret(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-secret") === secret;
}

/**
 * Guards cron routes. Accepts either:
 * - Vercel Cron, which sends `Authorization: Bearer <CRON_SECRET>` on a GET, or
 * - a manual call with the `x-admin-secret` header (curl, local testing).
 */
export function requireCronAuth(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`) {
    return true;
  }
  return requireAdminSecret(req);
}
