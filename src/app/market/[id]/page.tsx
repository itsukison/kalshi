import Link from "next/link";
import { ArrowLeft, ExternalLink, PlayCircle, Trophy } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BuyPanel } from "@/components/BuyPanel";
import { ProfitShareSheet, type ProfitShareData } from "@/components/ProfitShareSheet";
import { ShareButton } from "@/components/ShareButton";
import { formatJstDateTime, formatPoints } from "@/lib/format";

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
  const resolvedOutcome = market.resolved_outcome as "YES" | "NO" | null;
  const winningContracts =
    market.status === "resolved" && resolvedOutcome
      ? positions
          .filter((p) => p.side === resolvedOutcome)
          .reduce((sum, p) => sum + Number(p.contracts), 0)
      : 0;
  const userHasPosition = positions.length > 0;
  const userWon = winningContracts > 0;
  const payout = Math.round(winningContracts * 100);
  const stake = positions.reduce((sum, p) => sum + Number(p.total_cost), 0);
  const userSide =
    positions.length === 1 ? positions[0].side : positions.map((p) => p.side).join(" / ");
  const profitShareData: ProfitShareData | null =
    market.status === "resolved" && resolvedOutcome && userHasPosition
      ? {
          homeTeam: m?.home_team ?? "ホーム",
          awayTeam: m?.away_team ?? "アウェイ",
          league: m?.league,
          question: market.question,
          userSide,
          resolvedOutcome,
          homeScore: m?.home_score,
          awayScore: m?.away_score,
          stake,
          payout,
          profit: payout - stake,
          contracts: positions.reduce((sum, p) => sum + Number(p.contracts), 0),
        }
      : null;
  const matchLabel = m ? `${m.home_team} vs ${m.away_team}` : undefined;
  const highlightQuery = encodeURIComponent(
    `${matchLabel ?? market.question} ハイライト`
  );

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
          {matchLabel} · {formatJstDateTime(m.kickoff_at)}{" "}
          (JST)
        </p>
      )}

      <h1 className="mt-2 font-display font-semibold text-3xl md:text-4xl leading-tight">
        {market.question}
      </h1>

      <div className="mt-6 card p-5 md:p-6">
        <div className="grid gap-5 sm:grid-cols-[auto_auto_1fr] sm:items-end">
          <div>
            <p className="text-pulse-green text-sm">YES</p>
            <p className="font-display text-5xl text-pulse-green tabular-nums">{yes}</p>
          </div>
          <div>
            <p className="text-candy-pink text-sm">NO</p>
            <p className="font-display text-5xl text-candy-pink tabular-nums">{100 - yes}</p>
          </div>
          <p className="text-sm text-ash-gray sm:ml-auto sm:max-w-xs">
            YES価格はクラウドが見込む勝率（%）です。
          </p>
        </div>
      </div>

      {(market.status === "resolved" || market.ready_for_review) && (
        <div className="mt-6 rounded-[8px] border border-olive-stone p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-olive-stone text-pulse-green">
                <Trophy size={20} />
              </span>
              <div>
                <p className="bracket text-sm text-ash-gray">結果</p>
                {market.status === "resolved" && resolvedOutcome ? (
                  <>
                    <p className="mt-2 text-2xl font-semibold">
                      {resolvedOutcome}
                      <span className="ml-2 text-sm font-normal text-ash-gray">
                        で確定
                      </span>
                    </p>
                    {m?.home_score != null && m?.away_score != null && (
                      <p className="mt-1 text-sm text-ash-gray">
                        最終スコア {m.home_team} {m.home_score} - {m.away_score}{" "}
                        {m.away_team}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-ash-gray">
                    試合結果を取得済みです。管理者の確認後にポイントが反映されます。
                  </p>
                )}
              </div>
            </div>

            {market.status === "resolved" && userHasPosition && (
              <div className="rounded-[8px] border border-olive-stone px-4 py-3 text-sm">
                <p className={userWon ? "text-pulse-green" : "text-ash-gray"}>
                  あなたの結果: {userWon ? "的中" : "不的中"}
                </p>
                <p className="mt-1 text-ash-gray">
                  払い戻し{" "}
                  <span className="font-display text-cream-glow tabular-nums">
                    {formatPoints(payout)}
                  </span>{" "}
                  pt
                </p>
                <p
                  className={`mt-1 tabular-nums ${
                    payout - stake > 0
                      ? "text-pulse-green"
                      : payout - stake < 0
                        ? "text-candy-pink"
                        : "text-ash-gray"
                  }`}
                >
                  損益 {payout - stake > 0 ? "+" : ""}
                  {formatPoints(payout - stake)} pt
                </p>
                {profitShareData && (
                  <div className="mt-3">
                    <ProfitShareSheet
                      data={profitShareData}
                      buttonLabel="利益をシェア"
                      className="px-3 py-2"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        <BuyPanel
          marketId={market.id}
          marketQuestion={market.question}
          matchLabel={matchLabel}
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
        <div className="mt-6 card p-5 md:p-6">
          <p className="bracket text-sm text-ash-gray mb-3">保有ポジション</p>
          <div className="space-y-2">
            {positions.map((p) => (
              <div key={p.side} className="flex flex-wrap justify-between gap-2 text-sm">
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

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="card p-5 md:p-6">
          <p className="bracket text-sm text-ash-gray mb-2">決済ルール</p>
          <p className="text-sm text-cream-glow/90 leading-relaxed">{market.resolution_rule}</p>
        </div>

        <div className="card p-5 md:p-6">
          <p className="bracket text-sm text-ash-gray mb-2">ハイライト</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`https://www.youtube.com/results?search_query=${highlightQuery}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-[100px] border border-olive-stone px-3 py-2 text-sm text-cream-glow transition-colors hover:border-cream-glow"
            >
              <PlayCircle size={16} />
              YouTube
              <ExternalLink size={13} />
            </a>
            <a
              href={`https://www.google.com/search?tbm=vid&q=${highlightQuery}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-[100px] border border-olive-stone px-3 py-2 text-sm text-cream-glow transition-colors hover:border-cream-glow"
            >
              動画検索
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <ShareButton
          label="このマーケットをシェア"
          title="ヨソウのマーケット"
          text={`ヨソウで予測受付中: ${market.question}`}
        />
      </div>
    </div>
  );
}
