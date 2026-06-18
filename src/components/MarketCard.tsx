import Link from "next/link";
import { CalendarDays, TrendingUp } from "lucide-react";
import type { Market, Match } from "@/lib/database.types";
import { formatJstDateTime, relativeDayLabel } from "@/lib/format";

export type MarketWithMatch = Market & { matches: Match | null };

const STATUS_LABEL: Record<string, string> = {
  open: "取引中",
  closed: "結果待ち",
  resolved: "確定",
  cancelled: "中止",
};

const STATUS_COLOR: Record<string, string> = {
  open: "text-pulse-green",
  closed: "text-ember-orange",
  resolved: "text-ash-gray",
  cancelled: "text-ash-gray",
};

export function MarketCard({ market }: { market: MarketWithMatch }) {
  const yes = Math.round(Number(market.yes_price));
  const no = 100 - yes;
  const m = market.matches;
  const rel = relativeDayLabel(market.closes_at);
  const tradable = market.status === "open" && new Date(market.closes_at) > new Date();
  const movement = yes - Math.round(Number(market.initial_yes_price));
  const score =
    m?.home_score != null && m?.away_score != null
      ? `${m.home_score} - ${m.away_score}`
      : null;

  return (
    <Link
      href={`/market/${market.id}`}
      className="card block p-5 transition-colors hover:border-cream-glow md:p-6"
    >
      <div className="mb-3 flex items-center justify-between gap-3 text-xs">
        <span className="bracket min-w-0 truncate text-ash-gray">{m?.league ?? "サッカー"}</span>
        <span className={`shrink-0 ${STATUS_COLOR[market.status] ?? "text-ash-gray"}`}>
          {STATUS_LABEL[market.status] ?? market.status}
        </span>
      </div>

      {m && (
        <p className="mb-1 flex items-center gap-2 text-sm text-ash-gray">
          <span className="min-w-0 truncate">
            {m.home_team} vs {m.away_team}
          </span>
          {score && (
            <span className="shrink-0 rounded-[100px] border border-olive-stone px-2 py-0.5 text-xs tabular-nums text-cream-glow">
              {score}
            </span>
          )}
        </p>
      )}
      <h3 className="mb-3 text-base leading-snug md:text-lg">{market.question}</h3>

      {/* date / closing line */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ash-gray">
        <span className="flex min-w-0 items-center gap-1.5">
          <CalendarDays size={13} className="shrink-0" />
          {m ? formatJstDateTime(m.kickoff_at) : formatJstDateTime(market.closes_at)}
        </span>
        {market.status === "resolved" && market.resolved_outcome ? (
          <span className="ml-auto shrink-0 text-cream-glow">
            結果:{" "}
            <span
              className={
                market.resolved_outcome === "YES" ? "text-pulse-green" : "text-candy-pink"
              }
            >
              {market.resolved_outcome}
            </span>
          </span>
        ) : tradable && rel ? (
          <span className="ml-auto shrink-0">締切 {rel}</span>
        ) : (
          <span className="ml-auto shrink-0">締切済み</span>
        )}
      </div>

      {movement !== 0 && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-[100px] border border-olive-stone px-2.5 py-1 text-xs text-ash-gray">
          <TrendingUp size={13} />
          YES {movement > 0 ? "+" : ""}
          {movement}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-pulse-green">YES</span>
            <span className="font-display tabular-nums text-pulse-green">{yes}</span>
          </div>
          <div className="h-1.5 rounded-full bg-olive-stone overflow-hidden">
            <div className="h-full bg-pulse-green" style={{ width: `${yes}%` }} />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-candy-pink">NO</span>
            <span className="font-display tabular-nums text-candy-pink">{no}</span>
          </div>
          <div className="h-1.5 rounded-full bg-olive-stone overflow-hidden">
            <div className="h-full bg-candy-pink" style={{ width: `${no}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
