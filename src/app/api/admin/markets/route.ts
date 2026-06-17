import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { initialQYes, clampPrice } from "@/lib/lmsr";

/**
 * POST /api/admin/markets — create a market for a match.
 * body: { matchId, question, resolutionRule, initialYesPrice (1-99),
 *         questionEn?, bLiquidity?, closesAt? }
 */
export async function POST(req: NextRequest) {
  if (!requireAdminSecret(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const {
    matchId,
    question,
    questionEn,
    resolutionRule,
    initialYesPrice,
    bLiquidity = 150,
    closesAt,
  } = body as Record<string, unknown>;

  if (!matchId || !question || !resolutionRule || typeof initialYesPrice !== "number") {
    return NextResponse.json(
      { error: "matchId, question, resolutionRule, initialYesPrice are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: match, error: matchErr } = await admin
    .from("matches")
    .select("id, kickoff_at")
    .eq("id", matchId as string)
    .single();
  if (matchErr || !match) {
    return NextResponse.json({ error: "match not found" }, { status: 404 });
  }

  const price = clampPrice(Math.round(initialYesPrice));
  const b = Number(bLiquidity);
  const qYes = initialQYes(price / 100, b);

  const { data, error } = await admin
    .from("markets")
    .insert({
      match_id: matchId as string,
      question: question as string,
      question_en: (questionEn as string) ?? null,
      resolution_rule: resolutionRule as string,
      b_liquidity: b,
      q_yes: qYes,
      q_no: 0,
      yes_price: price,
      initial_yes_price: price,
      closes_at: (closesAt as string) ?? match.kickoff_at,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ market: data });
}
