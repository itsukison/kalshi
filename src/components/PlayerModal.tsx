"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Target,
  Sparkles,
  Flame,
  Trophy,
  Brain,
  Gem,
  Crown,
  Lock,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type { BadgeIcon } from "@/lib/achievements";
import { formatPoints, formatPercent, formatJstDate } from "@/lib/format";

const BADGE_ICONS: Record<BadgeIcon, LucideIcon> = {
  target: Target,
  sparkles: Sparkles,
  flame: Flame,
  trophy: Trophy,
  brain: Brain,
  gem: Gem,
  crown: Crown,
};

interface Bet {
  side: string;
  contracts: number;
  question: string;
  home_team: string | null;
  away_team: string | null;
  market_id: string | null;
  result: "win" | "lose" | "waiting" | "holding";
}

interface Badge {
  id: string;
  icon: BadgeIcon;
  label: string;
  description: string;
  earned: boolean;
}

interface PlayerData {
  player: {
    id: string;
    name: string;
    rank: number;
    balance: number;
    accuracy: number;
    netProfit: number;
    predictionCount: number;
    correctCount: number;
    biggestWin: number;
    createdAt: string;
  };
  bets: Bet[];
  badges: Badge[];
}

const RESULT_META: Record<Bet["result"], { label: string; className: string }> = {
  win: { label: "的中", className: "text-pulse-green" },
  lose: { label: "不的中", className: "text-ash-gray" },
  waiting: { label: "結果待ち", className: "text-ember-orange" },
  holding: { label: "保有中", className: "text-ash-gray" },
};

export function PlayerModal({
  playerId,
  onClose,
}: {
  playerId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<PlayerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    let active = true;
    fetch(`/api/players/${playerId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then((d) => active && setData(d))
      .catch(() => active && setError("プレイヤー情報を取得できませんでした。"));
    return () => {
      active = false;
    };
  }, [playerId]);

  const p = data?.player;
  const earnedBadges = data?.badges.filter((b) => b.earned) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-void-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-b-none rounded-t-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-olive-stone p-5 md:p-6">
          <div className="min-w-0">
            <p className="bracket text-xs text-ash-gray mb-1">予測家プロフィール</p>
            <h2 className="truncate font-display text-2xl font-semibold tracking-tight">
              {p?.name ?? "読み込み中…"}
            </h2>
            {p && (
              <p className="mt-1 text-xs text-ash-gray">
                総合ランク{" "}
                <span className="font-display text-pulse-green">#{p.rank}</span>
                {" · "}
                {formatJstDate(p.createdAt)}から参加
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ash-gray transition-colors hover:bg-olive-stone/40 hover:text-cream-glow"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
          {error && <p className="py-10 text-center text-sm text-candy-pink">{error}</p>}

          {!data && !error && <PlayerSkeleton />}

          {p && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="残高" value={formatPoints(p.balance)} unit="pt" accent />
                <MiniStat
                  label="純利益"
                  value={`${p.netProfit > 0 ? "+" : ""}${formatPoints(p.netProfit)}`}
                  unit="pt"
                  tone={p.netProfit > 0 ? "up" : p.netProfit < 0 ? "down" : "neutral"}
                />
                <MiniStat
                  label="的中率"
                  value={p.predictionCount > 0 ? formatPercent(p.accuracy) : "—"}
                />
                <MiniStat label="的中 / 予測" value={`${p.correctCount}/${p.predictionCount}`} />
              </div>

              {/* Badges */}
              {earnedBadges.length > 0 && (
                <div className="mt-6">
                  <p className="bracket mb-3 text-xs text-ash-gray">獲得した実績</p>
                  <div className="flex flex-wrap gap-2">
                    {earnedBadges.map((b) => {
                      const Icon = BADGE_ICONS[b.icon] ?? Lock;
                      return (
                        <span
                          key={b.id}
                          title={b.description}
                          className="inline-flex items-center gap-1.5 rounded-[100px] border border-olive-stone px-3 py-1.5 text-xs text-cream-glow"
                        >
                          <Icon size={14} className="text-pulse-green" />
                          {b.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Past bets */}
              <div className="mt-6">
                <p className="bracket mb-3 text-xs text-ash-gray">予測の履歴</p>
                <div className="card divide-y divide-olive-stone">
                  {data.bets.map((bet, i) => {
                    const meta = RESULT_META[bet.result];
                    const inner = (
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3">
                        <span
                          className={
                            bet.side === "YES" ? "text-pulse-green" : "text-candy-pink"
                          }
                        >
                          {bet.side}
                        </span>
                        <span className="min-w-0 truncate text-sm">
                          {bet.home_team && bet.away_team
                            ? `${bet.home_team} vs ${bet.away_team}`
                            : bet.question}
                        </span>
                        <span className={`shrink-0 text-xs ${meta.className}`}>
                          {meta.label}
                        </span>
                      </div>
                    );
                    return bet.market_id ? (
                      <Link
                        key={i}
                        href={`/market/${bet.market_id}`}
                        className="block transition-colors hover:bg-olive-stone/20"
                        onClick={onClose}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div key={i}>{inner}</div>
                    );
                  })}
                  {data.bets.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-ash-gray">
                      まだ予測はありません。
                    </div>
                  )}
                </div>
              </div>

              <Link
                href="/"
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-1.5 text-sm text-pulse-green"
              >
                マーケットで対決する
                <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[8px] border border-olive-stone p-3">
            <div className="mb-2 h-3 w-2/3 rounded bg-olive-stone/70" />
            <div className="h-5 w-1/2 rounded bg-olive-stone/70" />
          </div>
        ))}
      </div>

      {/* Badges row */}
      <div className="mt-6">
        <div className="mb-3 h-3 w-20 rounded bg-olive-stone/70" />
        <div className="flex flex-wrap gap-2">
          {[24, 20, 28].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded-[100px] bg-olive-stone/70"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>

      {/* Bet history rows */}
      <div className="mt-6">
        <div className="mb-3 h-3 w-24 rounded bg-olive-stone/70" />
        <div className="card divide-y divide-olive-stone">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3">
              <div className="h-4 w-8 rounded bg-olive-stone/70" />
              <div className="h-4 w-3/4 rounded bg-olive-stone/70" />
              <div className="h-4 w-10 rounded bg-olive-stone/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  unit = "",
  accent = false,
  tone = "neutral",
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
  tone?: "up" | "down" | "neutral";
}) {
  const color = accent
    ? "text-pulse-green"
    : tone === "up"
      ? "text-pulse-green"
      : tone === "down"
        ? "text-candy-pink"
        : "";
  return (
    <div className="rounded-[8px] border border-olive-stone p-3">
      <p className="mb-1 text-[11px] text-ash-gray">{label}</p>
      <p className={`font-display text-lg tabular-nums ${color}`}>
        {value}
        {unit && <span className="ml-1 text-xs text-ash-gray">{unit}</span>}
      </p>
    </div>
  );
}
