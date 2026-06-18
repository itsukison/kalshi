"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";
import { toJapaneseError } from "@/lib/errors";

export function AccountActions({ canClaim }: { canClaim: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/me/daily-bonus", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "受け取りに失敗しました");
      setMsg(`+100 pt を受け取りました（残高 ${Math.round(data.new_balance).toLocaleString()} pt）`);
      router.refresh();
    } catch (e) {
      setError(toJapaneseError(e, "ボーナスの受け取りに失敗しました。"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-olive-stone text-pulse-green">
          <Gift size={20} />
        </span>
        <div>
          <p className="text-sm text-cream-glow">デイリーボーナス</p>
          <p className="mt-1 text-sm text-ash-gray">
            {canClaim ? "今日の100ptを受け取れます。" : "本日の100ptは受け取り済みです。"}
          </p>
          {msg && <p className="mt-2 text-sm text-pulse-green">{msg}</p>}
          {error && <p className="mt-2 text-sm text-ember-orange">{error}</p>}
        </div>
      </div>
      <button
        onClick={claim}
        disabled={loading || !canClaim}
        className="btn-ghost shrink-0 text-sm"
      >
        {loading ? "処理中…" : canClaim ? "+100 pt 受け取る" : "受取済み"}
      </button>
    </div>
  );
}
