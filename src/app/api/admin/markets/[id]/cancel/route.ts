import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { toJapaneseError } from "@/lib/errors";

/** POST /api/admin/markets/:id/cancel — void market and refund all spend. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireAdminSecret(req)) {
    return NextResponse.json({ error: "管理者権限が必要です。" }, { status: 403 });
  }
  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("cancel_market", { p_market_id: id });
  if (error) {
    return NextResponse.json({ error: toJapaneseError(error, "マーケットのキャンセルに失敗しました。") }, { status: 400 });
  }
  return NextResponse.json(data);
}
