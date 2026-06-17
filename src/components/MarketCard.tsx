import Link from "next/link";
import { CalendarDays } from "lucide-react";
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

  return (
    <Link
      href={`/market/${market.id}`}
      className="card p-6 block hover:border-cream-glow transition-colors"
    >
      <div className="flex items-center justify-between text-xs mb-3">
        <span className="bracket text-ash-gray">{m?.league ?? "サッカー"}</span>
        <span className={STATUS_COLOR[market.status] ?? "text-ash-gray"}>
          {STATUS_LABEL[market.status] ?? market.status}
        </span>
      </div>

      {m && (
        <p className="text-sm text-ash-gray mb-1">
          {m.home_team} vs {m.away_team}
        </p>
      )}
      <h3 className="text-lg leading-snug mb-3">{market.question}</h3>

      {/* date / closing line */}
      <div className="flex items-center gap-2 text-xs text-ash-gray mb-4">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={13} className="shrink-0" />
          {m ? formatJstDateTime(m.kickoff_at) : formatJstDateTime(market.closes_at)}
        </span>
        {market.status === "resolved" && market.resolved_outcome ? (
          <span className="ml-auto text-cream-glow">
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
          <span className="ml-auto">締切 {rel}</span>
        ) : (
          <span className="ml-auto">締切済み</span>
        )}
      </div>

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
