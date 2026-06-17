"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { estimateContracts } from "@/lib/lmsr";

export function BuyPanel({
  marketId,
  qYes,
  qNo,
  b,
  status,
  closesAt,
  isLoggedIn,
  balance,
}: {
  marketId: string;
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
  const [done, setDone] = useState<string | null>(null);

  const tradable = status === "open" && new Date(closesAt) > new Date();
  const est =
    points > 0 ? estimateContracts(side, points, qYes, qNo, b) : null;

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
    setLoading(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch(`/api/markets/${marketId}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side, pointsSpent: points }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "購入に失敗しました");
      setDone(
        `${Number(data.position.contracts).toFixed(2)} 枚を購入しました（残高 ${Math.round(
          data.new_balance
        ).toLocaleString()} pt）`
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
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
        max={Math.floor(balance)}
        value={points}
        onChange={(e) => setPoints(Math.max(0, Math.floor(Number(e.target.value))))}
        className="w-full bg-transparent border border-olive-stone rounded-[8px] px-4 py-3 text-cream-glow tabular-nums focus:border-cream-glow outline-none"
      />
      <div className="flex gap-2 mt-2">
        {[100, 500, 1000].map((v) => (
          <button
            key={v}
            onClick={() => setPoints(v)}
            className="text-xs text-ash-gray border border-olive-stone rounded-[100px] px-3 py-1 hover:text-cream-glow"
          >
            {v}
          </button>
        ))}
        <span className="text-xs text-ash-gray ml-auto self-center">
          残高 {Math.round(balance).toLocaleString()} pt
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
              約 {Math.round(est.contracts * 100).toLocaleString()} pt
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
        disabled={loading || points <= 0 || points > balance}
        className="btn-ghost w-full mt-5"
      >
        {loading ? "処理中…" : "予測を確定する"}
      </button>

      {error && <p className="mt-3 text-sm text-ember-orange">{error}</p>}
      {done && <p className="mt-3 text-sm text-pulse-green">{done}</p>}
    </div>
  );
}
