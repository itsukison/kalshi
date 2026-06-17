"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AccountActions({ canClaim }: { canClaim: boolean }) {
  const router = useRouter();
  const supabase = createClient();
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
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <button onClick={claim} disabled={loading || !canClaim} className="btn-ghost">
        {canClaim ? "デイリーボーナスを受け取る (+100 pt)" : "本日のボーナスは受取済み"}
      </button>
      {msg && <p className="text-sm text-pulse-green">{msg}</p>}
      {error && <p className="text-sm text-ember-orange">{error}</p>}
      <button onClick={logout} className="text-sm text-ash-gray hover:text-cream-glow text-left">
        ログアウト
      </button>
    </div>
  );
}
