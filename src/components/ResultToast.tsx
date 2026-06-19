"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, TrendingDown, X } from "lucide-react";
import { formatPoints } from "@/lib/format";

type ResultItem = {
  marketId: string;
  question: string;
  side: "YES" | "NO";
  outcome: "YES" | "NO";
  won: boolean;
  payout: number;
  staked: number;
  resolvedAt: string;
};

/**
 * Surfaces newly-settled markets to the signed-in user as a dismissible toast
 * stack. Fetches once on mount; dismissing acknowledges everything shown (the
 * cursor is the newest resolved_at, so a single ack covers the whole stack).
 * Rendered only for logged-in users (see NavBar).
 */
export function ResultToast() {
  const router = useRouter();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me/results");
        if (!res.ok) return;
        const data = (await res.json()) as { results: ResultItem[]; cursor: string | null };
        if (cancelled || data.results.length === 0) return;
        setResults(data.results);
        setCursor(data.cursor);
        setOpen(true);
      } catch {
        /* silent — feedback is non-critical */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function acknowledge() {
    setOpen(false);
    if (!cursor) return;
    try {
      await fetch("/api/me/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seenAt: cursor }),
      });
      // Reflect any payout in the NavBar balance and stats.
      router.refresh();
    } catch {
      /* ignore — they can re-see results on next load if ack failed */
    }
  }

  if (!open || results.length === 0) return null;

  const wins = results.filter((r) => r.won).length;
  const total = results.reduce((s, r) => s + r.payout, 0);

  return (
    <div
      className="fixed inset-x-4 bottom-4 z-50 flex flex-col gap-3 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[360px]"
      role="status"
      aria-live="polite"
    >
      <div className="card border-pulse-green/40 p-4 shadow-xl shadow-black/40">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="bracket text-xs text-ash-gray">結果が確定しました</p>
            <p className="mt-1 font-display text-lg tracking-tight">
              {results.length}件の予測
              {wins > 0 && (
                <span className="text-pulse-green">
                  {" "}
                  / {wins}件的中 +{formatPoints(total)}pt
                </span>
              )}
            </p>
          </div>
          <button
            onClick={acknowledge}
            aria-label="閉じる"
            className="shrink-0 rounded-[6px] p-1 text-ash-gray hover:bg-olive-stone/40 hover:text-cream-glow"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex max-h-[40vh] flex-col gap-2 overflow-y-auto">
          {results.slice(0, 6).map((r) => (
            <Link
              key={r.marketId}
              href={`/market/${r.marketId}`}
              onClick={acknowledge}
              className="flex items-center gap-3 rounded-[8px] border border-olive-stone px-3 py-2.5 hover:bg-olive-stone/20"
            >
              <span
                className={`inline-flex size-8 shrink-0 items-center justify-center rounded-[6px] ${
                  r.won ? "text-pulse-green" : "text-candy-pink"
                }`}
              >
                {r.won ? <Trophy size={18} /> : <TrendingDown size={18} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-cream-glow">{r.question}</span>
                <span className="block text-xs text-ash-gray">
                  {r.side} 予測・結果 {r.outcome}
                </span>
              </span>
              <span
                className={`shrink-0 font-display text-sm tabular-nums ${
                  r.won ? "text-pulse-green" : "text-ash-gray"
                }`}
              >
                {r.won ? `+${formatPoints(r.payout)}` : "的中せず"}
              </span>
            </Link>
          ))}
          {results.length > 6 && (
            <Link
              href="/account"
              onClick={acknowledge}
              className="px-3 py-1 text-center text-xs text-pulse-green hover:underline"
            >
              ほか{results.length - 6}件をマイページで見る
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
