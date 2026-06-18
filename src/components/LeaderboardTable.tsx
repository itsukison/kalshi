"use client";

import { useMemo, useState } from "react";
import { formatPoints, formatPercent } from "@/lib/format";

export interface LeaderRow {
  id: string;
  display_name: string | null;
  username: string | null;
  points_balance: number;
  total_points_earned: number;
  total_points_lost: number;
  prediction_count: number;
  correct_prediction_count: number;
}

type SortKey = "points" | "winrate" | "profit" | "count";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "points", label: "ポイント" },
  { key: "winrate", label: "的中率" },
  { key: "profit", label: "純利益" },
  { key: "count", label: "予測数" },
];

function accuracy(r: LeaderRow): number {
  return r.prediction_count > 0 ? r.correct_prediction_count / r.prediction_count : 0;
}
function profit(r: LeaderRow): number {
  return Number(r.total_points_earned) - Number(r.total_points_lost);
}

export function LeaderboardTable({ rows }: { rows: LeaderRow[] }) {
  const [sort, setSort] = useState<SortKey>("points");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      switch (sort) {
        case "winrate":
          // sample-size aware: users with no predictions sink to the bottom,
          // ties on rate broken by who predicted more.
          if (a.prediction_count === 0 && b.prediction_count === 0) return 0;
          if (a.prediction_count === 0) return 1;
          if (b.prediction_count === 0) return -1;
          return (
            accuracy(b) - accuracy(a) || b.prediction_count - a.prediction_count
          );
        case "profit":
          return profit(b) - profit(a);
        case "count":
          return b.prediction_count - a.prediction_count;
        default:
          return Number(b.points_balance) - Number(a.points_balance);
      }
    });
    return copy;
  }, [rows, sort]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`rounded-[100px] border px-4 py-2 text-sm transition-colors ${
              sort === s.key
                ? "border-pulse-green font-semibold text-pulse-green"
                : "border-olive-stone text-ash-gray hover:text-cream-glow hover:border-cream-glow"
            }`}
          >
            {s.label}順
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[2.5rem_1fr_6rem_6rem_6rem] gap-3 px-6 py-3 text-xs text-ash-gray border-b border-olive-stone">
          <span>#</span>
          <span>ユーザー</span>
          <span className="text-right hidden sm:block">的中率</span>
          <span className="text-right hidden sm:block">純利益</span>
          <span className="text-right">ポイント</span>
        </div>

        <div className="divide-y divide-olive-stone">
          {sorted.map((r, i) => {
            const acc = r.prediction_count > 0 ? formatPercent(accuracy(r)) : "—";
            const pf = profit(r);
            return (
              <div
                key={r.id}
                className="grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[2.5rem_1fr_6rem_6rem_6rem] gap-3 px-6 py-4 items-center"
              >
                <span
                  className={`font-display text-lg tabular-nums ${
                    i < 3 ? "text-pulse-green" : "text-ash-gray"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="truncate">
                  {r.display_name ?? r.username ?? "名無しの予測家"}
                  <span className="block text-xs text-ash-gray sm:hidden">
                    的中 {acc} · {r.prediction_count}回
                  </span>
                </span>
                <span className="text-right tabular-nums hidden sm:block text-ash-gray">
                  {acc}
                </span>
                <span
                  className={`text-right tabular-nums hidden sm:block ${
                    pf > 0 ? "text-pulse-green" : pf < 0 ? "text-candy-pink" : "text-ash-gray"
                  }`}
                >
                  {pf > 0 ? "+" : ""}
                  {formatPoints(pf)}
                </span>
                <span className="text-right font-display tabular-nums">
                  {formatPoints(Number(r.points_balance))}
                </span>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div className="px-6 py-10 text-center text-ash-gray">
              まだランキングデータがありません。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
