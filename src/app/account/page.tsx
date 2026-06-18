import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Target,
  Sparkles,
  Flame,
  Trophy,
  Brain,
  Gem,
  Crown,
  Lock,
  ArrowRight,
  ReceiptText,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AccountActions } from "@/components/AccountActions";
import { ShareButton } from "@/components/ShareButton";
import { computeBadges, type BadgeIcon } from "@/lib/achievements";
import { formatJstDateTime, formatPoints, formatPercent } from "@/lib/format";
import { effectiveStatus } from "@/lib/marketStatus";

const BADGE_ICONS: Record<BadgeIcon, LucideIcon> = {
  target: Target,
  sparkles: Sparkles,
  flame: Flame,
  trophy: Trophy,
  brain: Brain,
  gem: Gem,
  crown: Crown,
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const balance = Number(profile.points_balance);

  // Parallel: positions, rank (how many richer), trades (volume), biggest single win.
  const [
    { data: positions },
    { count: richerCount },
    { data: trades },
    { data: wins },
    { data: ledger },
  ] = await Promise.all([
      supabase
        .from("positions")
        .select("side, contracts, total_cost, created_at, markets(id, question, status, closes_at, resolved_outcome)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gt("points_balance", balance),
      supabase.from("trades").select("points_spent").eq("user_id", user.id),
      supabase
        .from("point_ledger")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "settlement_win")
        .order("amount", { ascending: false })
        .limit(1),
      supabase
        .from("point_ledger")
        .select("amount, type, description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const accuracyRatio =
    profile.prediction_count > 0
      ? profile.correct_prediction_count / profile.prediction_count
      : 0;
  const netProfit = Number(profile.total_points_earned) - Number(profile.total_points_lost);
  const volume = (trades ?? []).reduce((s, t) => s + Number(t.points_spent), 0);
  const biggestWin = wins && wins.length > 0 ? Number(wins[0].amount) : 0;
  const rank = (richerCount ?? 0) + 1;
  const positionRows = positions ?? [];
  const effStatus = (p: (typeof positionRows)[number]) => {
    const m = p.markets as unknown as { status: string; closes_at: string } | null;
    return m ? effectiveStatus(m) : null;
  };
  const activeCount = positionRows.filter((p) => {
    const s = effStatus(p);
    return s === "open" || s === "closed";
  }).length;
  const resolvedCount = positionRows.filter((p) => effStatus(p) === "resolved").length;
  const waitingCount = positionRows.filter((p) => effStatus(p) === "closed").length;

  const jstToday = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  )
    .toISOString()
    .slice(0, 10);
  const canClaim = profile.last_daily_bonus_date !== jstToday;

  const badges = computeBadges({
    predictionCount: profile.prediction_count,
    correctCount: profile.correct_prediction_count,
    accuracy: accuracyRatio,
    balance,
    biggestWin,
    tradeCount: (trades ?? []).length,
  });
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="max-w-3xl mx-auto">
      <p className="bracket text-sm text-ash-gray mb-3">マイページ</p>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display font-semibold text-3xl tracking-tight">
          {profile.display_name ?? profile.username ?? "予測家"}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ash-gray">
            総合ランク{" "}
            <span className="font-display text-pulse-green text-lg">#{rank}</span>
          </span>
          <ShareButton
            label="成績をシェア"
            title="ヨソウ成績"
            text={`ヨソウで残高${formatPoints(balance)}pt、的中率${
              profile.prediction_count > 0 ? formatPercent(accuracyRatio) : "計測中"
            }。`}
            className="px-3 py-2"
          />
        </div>
      </div>

      {/* Core stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Stat label="残高" value={formatPoints(balance)} unit="pt" accent />
        <Stat
          label="純利益"
          value={`${netProfit > 0 ? "+" : ""}${formatPoints(netProfit)}`}
          unit="pt"
          tone={netProfit > 0 ? "up" : netProfit < 0 ? "down" : "neutral"}
        />
        <Stat
          label="的中率"
          value={profile.prediction_count > 0 ? formatPercent(accuracyRatio) : "—"}
        />
        <Stat
          label="的中 / 予測"
          value={`${profile.correct_prediction_count}/${profile.prediction_count}`}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="獲得ポイント累計" value={formatPoints(Number(profile.total_points_earned))} unit="pt" />
        <Stat label="投入ポイント累計" value={formatPoints(volume)} unit="pt" />
        <Stat label="最高獲得" value={formatPoints(biggestWin)} unit="pt" />
        <Stat label="保有中ポジション" value={`${activeCount}`} />
      </div>

      <div className="card p-6 mb-8">
        <AccountActions canClaim={canClaim} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
        <FlowStat label="結果待ち" value={`${waitingCount}`} note="確認待ちマーケット" />
        <FlowStat label="確定済み" value={`${resolvedCount}`} note="的中/不的中を確認済み" />
        <FlowStat label="履歴" value={`${ledger?.length ?? 0}`} note="直近ポイント明細" />
      </div>

      {/* Achievements */}
      <div className="flex items-center justify-between mb-3">
        <p className="bracket text-sm text-ash-gray">実績</p>
        <span className="text-xs text-ash-gray tabular-nums">
          {earnedCount}/{badges.length} 解除
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {badges.map((b) => {
          const Icon = b.earned ? BADGE_ICONS[b.icon] : Lock;
          return (
            <div
              key={b.id}
              className={`card p-4 flex gap-3 items-start ${b.earned ? "" : "opacity-40"}`}
            >
              <Icon
                size={22}
                className={`shrink-0 ${b.earned ? "text-pulse-green" : "text-ash-gray"}`}
              />
              <div>
                <p className={`text-sm ${b.earned ? "text-cream-glow" : "text-ash-gray"}`}>
                  {b.label}
                </p>
                <p className="text-xs text-ash-gray mt-0.5 leading-snug">{b.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Point ledger */}
      <div className="flex items-center justify-between mb-3">
        <p className="bracket text-sm text-ash-gray">ポイント履歴</p>
        <ReceiptText size={18} className="text-ash-gray" />
      </div>
      <div className="card divide-y divide-olive-stone mb-8">
        {(ledger ?? []).map((entry, i) => (
          <div
            key={`${entry.created_at}-${i}`}
            className="grid grid-cols-[1fr_auto] gap-3 px-5 py-4 md:px-6"
          >
            <div className="min-w-0">
              <p className="truncate text-sm">{ledgerLabel(entry.type)}</p>
              <p className="mt-1 text-xs text-ash-gray">
                {entry.description ?? formatJstDateTime(entry.created_at)}
              </p>
            </div>
            <span
              className={`font-display tabular-nums ${
                Number(entry.amount) >= 0 ? "text-pulse-green" : "text-candy-pink"
              }`}
            >
              {Number(entry.amount) >= 0 ? "+" : ""}
              {formatPoints(Number(entry.amount))} pt
            </span>
          </div>
        ))}
        {(!ledger || ledger.length === 0) && (
          <div className="px-6 py-10 text-center text-ash-gray">
            まだポイント履歴はありません。
          </div>
        )}
      </div>

      {/* Position history */}
      <p className="bracket text-sm text-ash-gray mb-3">ポジション履歴</p>
      <div className="card divide-y divide-olive-stone">
        {positionRows.map((p, i) => {
          const market = p.markets as unknown as {
            id: string;
            question: string;
            status: string;
            closes_at: string;
            resolved_outcome: string | null;
          } | null;
          const eff = market ? effectiveStatus(market) : null;
          const won = eff === "resolved" && market!.resolved_outcome === p.side;
          const pending = eff === "closed";
          return (
            <Link
              key={i}
              href={market ? `/market/${market.id}` : "#"}
              className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 px-5 py-4 hover:bg-olive-stone/20 md:grid-cols-[auto_1fr_auto_auto] md:items-center md:px-6"
            >
              <span className={p.side === "YES" ? "text-pulse-green" : "text-candy-pink"}>
                {p.side}
              </span>
              <span className="min-w-0 truncate text-sm">{market?.question ?? "—"}</span>
              <span className="text-xs text-ash-gray tabular-nums md:text-right">
                {Number(p.contracts).toFixed(2)} 枚
              </span>
              <span
                className={`text-xs ${
                  eff === "resolved"
                    ? won
                      ? "text-pulse-green"
                      : "text-ash-gray"
                    : pending
                      ? "text-ember-orange"
                      : "text-ash-gray"
                }`}
              >
                {eff === "resolved"
                  ? won
                    ? "的中"
                    : "不的中"
                  : pending
                    ? "結果待ち"
                    : "保有中"}
              </span>
            </Link>
          );
        })}
        {positionRows.length === 0 && (
          <div className="px-6 py-10 text-center text-ash-gray">
            まだ予測はありません。{" "}
            <Link href="/" className="inline-flex items-center gap-1 text-pulse-green">
              マーケットを見る
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

const LEDGER_LABELS: Record<string, string> = {
  signup_bonus: "新規登録ボーナス",
  daily_bonus: "デイリーボーナス",
  trade_spend: "予測に投入",
  settlement_win: "的中払い戻し",
  cancellation_refund: "キャンセル返金",
};

function ledgerLabel(type: string): string {
  return LEDGER_LABELS[type] ?? "ポイント更新";
}

function Stat({
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
    <div className="card p-4">
      <p className="text-xs text-ash-gray mb-1">{label}</p>
      <p className={`font-display text-2xl tabular-nums ${color}`}>
        {value}
        {unit && <span className="text-sm text-ash-gray ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function FlowStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs text-ash-gray">
        <Share2 size={14} />
        {label}
      </div>
      <p className="mt-2 font-display text-3xl tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-ash-gray">{note}</p>
    </div>
  );
}
