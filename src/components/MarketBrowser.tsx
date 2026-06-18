"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { MarketCard, type MarketWithMatch } from "@/components/MarketCard";
import { Dropdown } from "@/components/Dropdown";
import { effectiveStatus } from "@/lib/marketStatus";

const PAGE_SIZE = 12;

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
  const s = effectiveStatus(m);
  if (s === "open") return "open";
  if (s === "resolved" || s === "cancelled") return "done";
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
      default: {
        // 試合が近い順: upcoming games first (soonest kickoff first), then past
        // games after, most-recent first — so approaching matches lead the list.
        const now = Date.now();
        const aUpcoming = kickoffTime(a) >= now;
        const bUpcoming = kickoffTime(b) >= now;
        if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
        return aUpcoming
          ? kickoffTime(a) - kickoffTime(b)
          : kickoffTime(b) - kickoffTime(a);
      }
    }
  });
}

export function MarketBrowser({ markets }: { markets: MarketWithMatch[] }) {
  const [active, setActive] = useState<FilterKey>("open");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("kickoff");
  const [visible, setVisible] = useState(PAGE_SIZE);

  // collapse back to the first page whenever the visible set changes (adjust during render)
  const resetKey = `${active}|${query}|${sort}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setVisible(PAGE_SIZE);
  }

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
      <div className="mb-5 space-y-3 sm:mb-6">
        <div className="grid grid-cols-[minmax(0,1fr)_3rem] gap-2 sm:grid-cols-[minmax(0,1fr)_240px] sm:gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
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

          <Dropdown
            value={sort}
            onChange={(value) => setSort(value)}
            ariaLabel="並び替え"
            options={SORTS.map((s) => ({ value: s.key, label: s.label }))}
            icon={<SlidersHorizontal size={18} className="shrink-0 text-ash-gray" />}
            mobileIconOnly
          />
        </div>

        <div>
          <div className="grid grid-cols-4 gap-1.5 sm:flex sm:gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                aria-pressed={active === t.key}
                className={`min-h-11 min-w-0 whitespace-nowrap rounded-[100px] border px-2 py-2 text-xs transition-colors sm:px-4 sm:text-sm ${
                  active === t.key
                    ? "bg-cream-glow text-void-black border-transparent"
                    : "border-olive-stone text-ash-gray hover:text-cream-glow hover:border-cream-glow"
                }`}
              >
                {t.label}
                <span className="ml-1 hidden tabular-nums opacity-70 min-[360px]:inline sm:ml-2">
                  {counts[t.key]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mb-3 text-sm text-ash-gray">
          {Math.min(visible, filtered.length).toLocaleString("ja-JP")} /{" "}
          {filtered.length.toLocaleString("ja-JP")}件表示
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {filtered.slice(0, visible).map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="mt-6 flex items-center justify-center">
              {visible < filtered.length ? (
                <button
                  type="button"
                  onClick={() => setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length))}
                  className="inline-flex items-center gap-1.5 rounded-[100px] border border-olive-stone px-5 py-2.5 text-sm text-ash-gray transition-colors hover:border-cream-glow hover:text-cream-glow"
                >
                  もっと見る
                  <ChevronDown size={16} />
                  <span className="tabular-nums opacity-70">
                    残り{(filtered.length - visible).toLocaleString("ja-JP")}件
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setVisible(PAGE_SIZE)}
                  className="rounded-[100px] border border-olive-stone px-5 py-2.5 text-sm text-ash-gray transition-colors hover:border-cream-glow hover:text-cream-glow"
                >
                  閉じる
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="card p-10 text-center text-ash-gray">
          該当するマーケットはありません。
        </div>
      )}
    </div>
  );
}
