import Link from "next/link";
import { CalendarDays, TrendingUp } from "lucide-react";
import type { Market, Match } from "@/lib/database.types";
import { formatJstDateTime, relativeDayLabel } from "@/lib/format";
import { effectiveStatus, isTradable, STATUS_LABEL, STATUS_COLOR } from "@/lib/marketStatus";

export type MarketWithMatch = Market & { matches: Match | null };

export function MarketCard({ market }: { market: MarketWithMatch }) {
  const yes = Math.round(Number(market.yes_price));
  const no = 100 - yes;
  const m = market.matches;
  const rel = relativeDayLabel(market.closes_at);
  const status = effectiveStatus(market);
  const tradable = isTradable(market);
  const movement = yes - Math.round(Number(market.initial_yes_price));
  const score =
    m?.home_score != null && m?.away_score != null
      ? `${m.home_score} - ${m.away_score}`
      : null;

  return (
    <Link
      href={`/market/${market.id}`}
      className="card flex h-full flex-col p-5 transition-colors hover:border-cream-glow md:p-6"
    >
      <div className="mb-3 flex items-center justify-between gap-3 text-xs">
        <span className="bracket min-w-0 truncate text-ash-gray">{m?.league ?? "サッカー"}</span>
        <span className={`shrink-0 ${STATUS_COLOR[status] ?? "text-ash-gray"}`}>
          {STATUS_LABEL[status] ?? market.status}
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
      <h3 className="mb-3 line-clamp-2 min-h-[2.75rem] text-base leading-snug md:min-h-[3.25rem] md:text-lg">
        {market.question}
      </h3>

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

      <div className="mt-auto">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-pulse-green">
            YES <span className="font-display tabular-nums">{yes}</span>
          </span>
          <span className="text-candy-pink">
            <span className="font-display tabular-nums">{no}</span> NO
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-olive-stone">
          <div className="bg-pulse-green" style={{ width: `${yes}%` }} />
          <div className="bg-candy-pink" style={{ width: `${no}%` }} />
        </div>
      </div>
    </Link>
  );
}
