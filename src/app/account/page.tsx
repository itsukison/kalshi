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
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AccountActions } from "@/components/AccountActions";
import { computeBadges, type BadgeIcon } from "@/lib/achievements";
import { formatPoints, formatPercent } from "@/lib/format";

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
  const [{ data: positions }, { count: richerCount }, { data: trades }, { data: wins }] =
    await Promise.all([
      supabase
        .from("positions")
        .select("side, contracts, total_cost, markets(id, question, status, resolved_outcome)")
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
    ]);

  const accuracyRatio =
    profile.prediction_count > 0
      ? profile.correct_prediction_count / profile.prediction_count
      : 0;
  const netProfit = Number(profile.total_points_earned) - Number(profile.total_points_lost);
  const volume = (trades ?? []).reduce((s, t) => s + Number(t.points_spent), 0);
  const biggestWin = wins && wins.length > 0 ? Number(wins[0].amount) : 0;
  const rank = (richerCount ?? 0) + 1;
  const activeCount = (positions ?? []).filter((p) => {
    const m = p.markets as unknown as { status: string } | null;
    return m && (m.status === "open" || m.status === "closed");
  }).length;

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
      <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
        <h1 className="font-display font-semibold text-3xl tracking-tight">
          {profile.display_name ?? profile.username ?? "予測家"}
        </h1>
        <span className="text-sm text-ash-gray">
          総合ランク{" "}
          <span className="font-display text-pulse-green text-lg">#{rank}</span>
        </span>
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

      {/* Position history */}
      <p className="bracket text-sm text-ash-gray mb-3">ポジション履歴</p>
      <div className="card divide-y divide-olive-stone">
        {(positions ?? []).map((p, i) => {
          const market = p.markets as unknown as {
            id: string;
            question: string;
            status: string;
            resolved_outcome: string | null;
          } | null;
          const won = market?.status === "resolved" && market.resolved_outcome === p.side;
          return (
            <Link
              key={i}
              href={market ? `/market/${market.id}` : "#"}
              className="flex items-center gap-3 px-6 py-4 hover:bg-olive-stone/20"
            >
              <span className={p.side === "YES" ? "text-pulse-green" : "text-candy-pink"}>
                {p.side}
              </span>
              <span className="flex-1 truncate text-sm">{market?.question ?? "—"}</span>
              <span className="text-xs text-ash-gray tabular-nums">
                {Number(p.contracts).toFixed(2)} 枚
              </span>
              {market?.status === "resolved" && (
                <span className={`text-xs ${won ? "text-pulse-green" : "text-ash-gray"}`}>
                  {won ? "的中" : "不的中"}
                </span>
              )}
            </Link>
          );
        })}
        {(!positions || positions.length === 0) && (
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
