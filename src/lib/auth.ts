import { NextRequest } from "next/server";

/** Guards admin/cron routes with a shared secret sent via the `x-admin-secret` header. */
export function requireAdminSecret(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-secret") === secret;
}
