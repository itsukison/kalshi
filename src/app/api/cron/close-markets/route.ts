import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { toJapaneseError } from "@/lib/errors";

/** POST /api/cron/close-markets — flip open markets past closes_at to 'closed'. */
export async function POST(req: NextRequest) {
  if (!requireAdminSecret(req)) {
    return NextResponse.json({ error: "管理者権限が必要です。" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("markets")
    .update({ status: "closed" })
    .eq("status", "open")
    .lte("closes_at", new Date().toISOString())
    .select("id");

  if (error) {
    return NextResponse.json({ error: toJapaneseError(error, "マーケットの締め切り処理に失敗しました。") }, { status: 500 });
  }
  return NextResponse.json({ closed: data?.length ?? 0, ids: data?.map((m) => m.id) });
}
