"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { MarketCard, type MarketWithMatch } from "@/components/MarketCard";

type FilterKey = "all" | "open" | "closed" | "done";
type SortKey = "kickoff" | "closing" | "popular" | "underdog" | "movement";

const TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "open", label: "取引中" },
  { key: "closed", label: "結果待ち" },
  { key: "done", label: "終了" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "kickoff", label: "試合が近い順" },
  { key: "closing", label: "締切が近い順" },
  { key: "popular", label: "YES人気順" },
  { key: "underdog", label: "NO人気順" },
  { key: "movement", label: "価格変動順" },
];

function bucket(m: MarketWithMatch): FilterKey {
  if (m.status === "open" && new Date(m.closes_at) > new Date()) return "open";
  if (m.status === "resolved" || m.status === "cancelled") return "done";
  return "closed"; // closed, or open-but-past-close awaiting result
}

function searchableText(m: MarketWithMatch): string {
  const match = m.matches;
  return [
    m.question,
    m.question_en,
    m.status,
    match?.league,
    match?.home_team,
    match?.away_team,
    match?.sport,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function kickoffTime(m: MarketWithMatch): number {
  return new Date(m.matches?.kickoff_at ?? m.closes_at).getTime();
}

function sortMarkets(markets: MarketWithMatch[], sort: SortKey): MarketWithMatch[] {
  return [...markets].sort((a, b) => {
    switch (sort) {
      case "popular":
        return Number(b.yes_price) - Number(a.yes_price) || kickoffTime(a) - kickoffTime(b);
      case "underdog":
        return Number(a.yes_price) - Number(b.yes_price) || kickoffTime(a) - kickoffTime(b);
      case "movement":
        return (
          Math.abs(Number(b.yes_price) - Number(b.initial_yes_price)) -
            Math.abs(Number(a.yes_price) - Number(a.initial_yes_price)) ||
          kickoffTime(a) - kickoffTime(b)
        );
      case "closing":
        return new Date(a.closes_at).getTime() - new Date(b.closes_at).getTime();
      default:
        return kickoffTime(a) - kickoffTime(b);
    }
  });
}

export function MarketBrowser({ markets }: { markets: MarketWithMatch[] }) {
  const [active, setActive] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("kickoff");

  const buckets = useMemo(() => markets.map(bucket), [markets]);
  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: markets.length, open: 0, closed: 0, done: 0 };
    buckets.forEach((b) => (c[b] += 1));
    return c;
  }, [buckets, markets.length]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const visible = markets.filter((market, i) => {
      const statusMatch = active === "all" || buckets[i] === active;
      const queryMatch = !needle || searchableText(market).includes(needle);
      return statusMatch && queryMatch;
    });
    return sortMarkets(visible, sort);
  }, [active, buckets, markets, query, sort]);

  return (
    <div>
      <div className="mb-6 space-y-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
          <label className="relative block">
            <span className="sr-only">試合を検索</span>
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ash-gray"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="チーム名・試合・マーケットを検索"
              className="h-12 w-full rounded-[8px] border border-olive-stone bg-transparent pl-11 pr-11 text-sm text-cream-glow outline-none transition-colors placeholder:text-ash-gray focus:border-cream-glow"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-ash-gray transition-colors hover:bg-olive-stone/40 hover:text-cream-glow"
                aria-label="検索をクリア"
              >
                <X size={16} />
              </button>
            )}
          </label>

          <label className="relative block">
            <span className="sr-only">並び替え</span>
            <SlidersHorizontal
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ash-gray"
            />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-12 w-full appearance-none rounded-[8px] border border-olive-stone bg-void-black px-11 text-sm text-cream-glow outline-none transition-colors focus:border-cream-glow"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ash-gray">
              ▼
            </span>
          </label>
        </div>

        <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
          <div className="flex min-w-max gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                aria-pressed={active === t.key}
                className={`rounded-[100px] border px-4 py-2 text-sm transition-colors ${
                  active === t.key
                    ? "bg-cream-glow text-void-black border-transparent"
                    : "border-olive-stone text-ash-gray hover:text-cream-glow hover:border-cream-glow"
                }`}
              >
                {t.label}
                <span className="ml-2 tabular-nums opacity-70">{counts[t.key]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mb-3 text-sm text-ash-gray">
          {filtered.length.toLocaleString("ja-JP")}件表示
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {filtered.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center text-ash-gray">
          該当するマーケットはありません。
        </div>
      )}
    </div>
  );
}
