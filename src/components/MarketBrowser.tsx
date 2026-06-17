"use client";

import { useMemo, useState } from "react";
import { MarketCard, type MarketWithMatch } from "@/components/MarketCard";

type FilterKey = "all" | "open" | "closed" | "done";

const TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "open", label: "取引中" },
  { key: "closed", label: "結果待ち" },
  { key: "done", label: "終了" },
];

function bucket(m: MarketWithMatch): FilterKey {
  if (m.status === "open" && new Date(m.closes_at) > new Date()) return "open";
  if (m.status === "resolved" || m.status === "cancelled") return "done";
  return "closed"; // closed, or open-but-past-close awaiting result
}

export function MarketBrowser({ markets }: { markets: MarketWithMatch[] }) {
  const [active, setActive] = useState<FilterKey>("all");

  const buckets = useMemo(() => markets.map(bucket), [markets]);
  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: markets.length, open: 0, closed: 0, done: 0 };
    buckets.forEach((b) => (c[b] += 1));
    return c;
  }, [buckets, markets.length]);

  const filtered = markets.filter((_, i) => active === "all" || buckets[i] === active);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
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

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
