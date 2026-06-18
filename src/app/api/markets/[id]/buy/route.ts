import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toJapaneseError } from "@/lib/errors";

/** POST /api/markets/:id/buy  body: { side: "YES"|"NO", pointsSpent: number } */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: { side?: string; pointsSpent?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { side, pointsSpent } = body;
  if (side !== "YES" && side !== "NO") {
    return NextResponse.json({ error: "YES または NO を選択してください。" }, { status: 400 });
  }
  if (typeof pointsSpent !== "number" || pointsSpent <= 0) {
    return NextResponse.json({ error: "ポイントは正の数で指定してください" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("buy_contract", {
    p_market_id: id,
    p_side: side,
    p_points_spent: pointsSpent,
  });

  if (error) {
    return NextResponse.json({ error: toJapaneseError(error, "購入に失敗しました。") }, { status: 400 });
  }
  return NextResponse.json(data);
}
