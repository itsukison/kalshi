import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BuyPanel } from "@/components/BuyPanel";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  open: "取引中",
  closed: "結果待ち",
  resolved: "確定",
  cancelled: "中止",
};

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: market } = await supabase
    .from("markets")
    .select("*, matches(*)")
    .eq("id", id)
    .single();
  if (!market) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let balance = 0;
  let positions: { side: string; contracts: number; total_cost: number }[] = [];
  if (user) {
    const [{ data: profile }, { data: pos }] = await Promise.all([
      supabase.from("profiles").select("points_balance").eq("id", user.id).single(),
      supabase
        .from("positions")
        .select("side, contracts, total_cost")
        .eq("market_id", id)
        .eq("user_id", user.id),
    ]);
    balance = profile ? Number(profile.points_balance) : 0;
    positions = pos ?? [];
  }

  const m = market.matches;
  const yes = Math.round(Number(market.yes_price));

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-ash-gray hover:text-cream-glow"
      >
        <ArrowLeft size={14} /> マーケット一覧
      </Link>

      <div className="mt-5 flex items-center justify-between text-xs text-ash-gray">
        <span className="bracket">{m?.league ?? "サッカー"}</span>
        <span>{STATUS_LABEL[market.status] ?? market.status}</span>
      </div>

      {m && (
        <p className="mt-3 text-ash-gray">
          {m.home_team} vs {m.away_team} ·{" "}
          {new Date(m.kickoff_at).toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          (JST)
        </p>
      )}

      <h1 className="mt-2 font-display font-semibold text-3xl md:text-4xl leading-tight">
        {market.question}
      </h1>

      <div className="mt-6 card p-6">
        <div className="flex items-end gap-8">
          <div>
            <p className="text-pulse-green text-sm">YES</p>
            <p className="font-display text-5xl text-pulse-green tabular-nums">{yes}</p>
          </div>
          <div>
            <p className="text-candy-pink text-sm">NO</p>
            <p className="font-display text-5xl text-candy-pink tabular-nums">{100 - yes}</p>
          </div>
          <p className="text-ash-gray text-sm ml-auto max-w-xs">
            YES価格はクラウドが見込む勝率（%）です。
          </p>
        </div>
      </div>

      <div className="mt-6">
        <BuyPanel
          marketId={market.id}
          qYes={Number(market.q_yes)}
          qNo={Number(market.q_no)}
          b={Number(market.b_liquidity)}
          status={market.status}
          closesAt={market.closes_at}
          isLoggedIn={!!user}
          balance={balance}
        />
      </div>

      {positions.length > 0 && (
        <div className="mt-6 card p-6">
          <p className="bracket text-sm text-ash-gray mb-3">保有ポジション</p>
          <div className="space-y-2">
            {positions.map((p) => (
              <div key={p.side} className="flex justify-between text-sm">
                <span className={p.side === "YES" ? "text-pulse-green" : "text-candy-pink"}>
                  {p.side}
                </span>
                <span className="tabular-nums">
                  {Number(p.contracts).toFixed(2)} 枚 ／ 投入 {Math.round(Number(p.total_cost))} pt
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 card p-6">
        <p className="bracket text-sm text-ash-gray mb-2">決済ルール</p>
        <p className="text-sm text-cream-glow/90 leading-relaxed">{market.resolution_rule}</p>
      </div>
    </div>
  );
}
