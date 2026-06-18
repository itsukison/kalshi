"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toJapaneseError } from "@/lib/errors";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(toJapaneseError(err, "ログアウトに失敗しました。"));
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className={`inline-flex items-center justify-center gap-1.5 rounded-[100px] border border-olive-stone px-3 py-2 text-sm text-ash-gray transition-colors hover:border-cream-glow hover:text-cream-glow disabled:opacity-40 ${className}`}
        aria-label="ログアウト"
      >
        <LogOut size={15} />
        <span className="hidden sm:inline">{loading ? "処理中" : "ログアウト"}</span>
      </button>
      {error && (
        <span className="absolute right-0 top-full mt-2 w-52 rounded-[8px] border border-olive-stone bg-void-black p-2 text-xs text-ember-orange">
          {error}
        </span>
      )}
    </div>
  );
}
