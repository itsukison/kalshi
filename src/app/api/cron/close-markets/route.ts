import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** POST /api/cron/close-markets — flip open markets past closes_at to 'closed'. */
export async function POST(req: NextRequest) {
  if (!requireAdminSecret(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("markets")
    .update({ status: "closed" })
    .eq("status", "open")
    .lte("closes_at", new Date().toISOString())
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ closed: data?.length ?? 0, ids: data?.map((m) => m.id) });
}
