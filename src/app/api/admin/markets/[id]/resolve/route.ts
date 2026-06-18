import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { toJapaneseError } from "@/lib/errors";

/** POST /api/admin/markets/:id/resolve  body: { outcome: "YES"|"NO", settlementSource?: string } */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireAdminSecret(req)) {
    return NextResponse.json({ error: "管理者権限が必要です。" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { outcome, settlementSource } = body as {
    outcome?: string;
    settlementSource?: string;
  };
  if (outcome !== "YES" && outcome !== "NO") {
    return NextResponse.json({ error: "結果は YES または NO で指定してください。" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("resolve_market", {
    p_market_id: id,
    p_outcome: outcome,
    p_settlement_source: settlementSource ?? "admin",
  });
  if (error) {
    return NextResponse.json({ error: toJapaneseError(error, "マーケットの確定に失敗しました。") }, { status: 400 });
  }
  return NextResponse.json(data);
}
