"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { estimateContracts } from "@/lib/lmsr";
import { ShareButton } from "@/components/ShareButton";
import { toJapaneseError } from "@/lib/errors";

type PurchaseSummary = {
  side: "YES" | "NO";
  pointsSpent: number;
  contracts: number;
  newBalance: number;
};

export function BuyPanel({
  marketId,
  marketQuestion,
  matchLabel,
  qYes,
  qNo,
  b,
  status,
  closesAt,
  isLoggedIn,
  balance,
}: {
  marketId: string;
  marketQuestion: string;
  matchLabel?: string;
  qYes: number;
  qNo: number;
  b: number;
  status: string;
  closesAt: string;
  isLoggedIn: boolean;
  balance: number;
}) {
  const router = useRouter();
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [points, setPoints] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PurchaseSummary | null>(null);

  const tradable = status === "open" && new Date(closesAt) > new Date();
  const currentBalance = purchase?.newBalance ?? balance;
  const est =
    points > 0 ? estimateContracts(side, points, qYes, qNo, b) : null;
  const projectedPayout = est ? Math.round(est.contracts * 100) : 0;

  if (!tradable) {
    return (
      <div className="card p-6 text-center text-ash-gray">
        このマーケットは取引を締め切りました。
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="card p-6 text-center">
        <p className="text-ash-gray mb-4">予測するにはログインが必要です。</p>
        <Link href="/login" className="btn-ghost inline-block">
          ログイン / 新規登録
        </Link>
      </div>
    );
  }

  async function submit() {
    if (points > currentBalance) {
      setError("ポイント残高が不足しています。");
      return;
    }
    setLoading(true);
    setError(null);
    setPurchase(null);
    try {
      const res = await fetch(`/api/markets/${marketId}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side, pointsSpent: points }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "購入に失敗しました");
      const contracts = Number(
        data.trade?.contracts_bought ?? data.position?.contracts ?? est?.contracts ?? 0
      );
      const newBalance = Number(data.new_balance ?? currentBalance - points);
      setPurchase({ side, pointsSpent: points, contracts, newBalance });
      router.refresh();
    } catch (e) {
      setError(toJapaneseError(e, "購入に失敗しました。"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5 md:p-6">
      {purchase && (
        <div className="mb-5 rounded-[8px] border border-pulse-green/70 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 shrink-0 text-pulse-green" size={21} />
            <div className="min-w-0">
              <p className="text-sm text-pulse-green">予測を受け付けました</p>
              <p className="mt-1 text-sm leading-relaxed text-cream-glow">
                {purchase.side} に {purchase.pointsSpent.toLocaleString("ja-JP")} pt 投入。
                約 {purchase.contracts.toFixed(2)} 枚を保有中です。
              </p>
              <p className="mt-1 text-xs text-ash-gray">
                更新後残高 {Math.round(purchase.newBalance).toLocaleString("ja-JP")} pt
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href="/account"
                  className="inline-flex items-center justify-center gap-1.5 rounded-[100px] border border-olive-stone px-3 py-2 text-sm text-cream-glow transition-colors hover:border-cream-glow"
                >
                  マイページで確認
                  <ExternalLink size={14} />
                </Link>
                <ShareButton
                  label="自慢する"
                  title="ヨソウで予測しました"
                  text={`ヨソウで「${marketQuestion}」に${purchase.side}予測。${purchase.pointsSpent.toLocaleString(
                    "ja-JP"
                  )}pt投入しました。`}
                  className="px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => setSide("YES")}
          className={`pill border rounded-[100px] py-3 transition-colors ${
            side === "YES"
              ? "bg-pulse-green text-void-black border-transparent"
              : "border-olive-stone text-pulse-green hover:border-pulse-green"
          }`}
        >
          YES で予測
        </button>
        <button
          onClick={() => setSide("NO")}
          className={`rounded-[100px] border py-3 transition-colors ${
            side === "NO"
              ? "bg-candy-pink text-void-black border-transparent"
              : "border-olive-stone text-candy-pink hover:border-candy-pink"
          }`}
        >
          NO で予測
        </button>
      </div>

      <label className="block text-sm text-ash-gray mb-2">投入ポイント</label>
      <input
        type="number"
        min={1}
        max={Math.floor(currentBalance)}
        value={points}
        onChange={(e) => setPoints(Math.max(0, Math.floor(Number(e.target.value))))}
        className="w-full bg-transparent border border-olive-stone rounded-[8px] px-4 py-3 text-cream-glow tabular-nums focus:border-cream-glow outline-none"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {[100, 500, 1000].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setPoints(Math.min(v, Math.floor(currentBalance)))}
            disabled={currentBalance < 1}
            className="rounded-[100px] border border-olive-stone px-3 py-1 text-xs text-ash-gray hover:text-cream-glow disabled:opacity-40"
          >
            {v}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-ash-gray">
          残高 {Math.round(currentBalance).toLocaleString("ja-JP")} pt
        </span>
      </div>

      {est && points > 0 && (
        <div className="mt-4 text-sm text-ash-gray space-y-1">
          <div className="flex justify-between">
            <span>推定獲得枚数</span>
            <span className="tabular-nums text-cream-glow">
              約 {est.contracts.toFixed(2)} 枚
            </span>
          </div>
          <div className="flex justify-between">
            <span>的中時の払い戻し</span>
            <span className="tabular-nums text-cream-glow">
              約 {projectedPayout.toLocaleString("ja-JP")} pt
            </span>
          </div>
          <div className="flex justify-between">
            <span>購入後のYES価格（目安）</span>
            <span className="tabular-nums text-cream-glow">{est.newYesPrice}</span>
          </div>
          <p className="text-xs text-ash-gray/70 pt-1">
            ※ 価格は変動します。最終的な枚数はサーバーが確定します。
          </p>
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading || points <= 0 || points > currentBalance}
        className="btn-ghost w-full mt-5"
      >
        {loading ? "処理中…" : "予測を確定する"}
      </button>

      {error && <p className="mt-3 text-sm text-ember-orange">{error}</p>}
      {matchLabel && (
        <p className="mt-3 text-xs text-ash-gray">
          対象試合: <span className="text-cream-glow">{matchLabel}</span>
        </p>
      )}
    </div>
  );
}
