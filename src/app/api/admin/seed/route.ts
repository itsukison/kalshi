import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { initialQYes } from "@/lib/lmsr";

/** POST /api/admin/seed — demo World Cup matches + markets (idempotent by external_id). */
export async function POST(req: NextRequest) {
  if (!requireAdminSecret(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const admin = createAdminClient();
  const B = 150;
  const now = Date.now();
  const day = 86400000;

  const fixtures = [
    { ext: "seed-jp-br", home: "日本", away: "ブラジル", price: 28, inDays: 1 },
    { ext: "seed-ar-fr", home: "アルゼンチン", away: "フランス", price: 54, inDays: 2 },
    { ext: "seed-es-de", home: "スペイン", away: "ドイツ", price: 49, inDays: 3 },
    { ext: "seed-en-nl", home: "イングランド", away: "オランダ", price: 58, inDays: 4 },
  ];

  let matches = 0;
  let markets = 0;
  for (const f of fixtures) {
    const kickoff = new Date(now + f.inDays * day).toISOString();
    const { data: match } = await admin
      .from("matches")
      .upsert(
        {
          external_id: f.ext,
          sport_key: "soccer_fifa_world_cup",
          sport: "soccer",
          league: "FIFA World Cup",
          home_team: f.home,
          away_team: f.away,
          kickoff_at: kickoff,
          source: "seed",
        },
        { onConflict: "external_id" }
      )
      .select("id")
      .single();
    if (!match) continue;
    matches++;

    const { count } = await admin
      .from("markets")
      .select("id", { count: "exact", head: true })
      .eq("match_id", match.id);
    if ((count ?? 0) === 0) {
      await admin.from("markets").insert({
        match_id: match.id,
        question: `${f.home}は${f.away}に勝ちますか？`,
        question_en: `Will ${f.home} beat ${f.away}?`,
        resolution_rule:
          "本戦・延長で本拠地表記チームが勝利した場合はYES。引き分けまたは相手の勝利、PK戦のみの決着はNO。",
        b_liquidity: B,
        q_yes: initialQYes(f.price / 100, B),
        q_no: 0,
        yes_price: f.price,
        initial_yes_price: f.price,
        closes_at: kickoff,
      });
      markets++;
    }
  }

  return NextResponse.json({ matches, markets });
}
