"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toJapaneseError } from "@/lib/errors";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName || email.split("@")[0] } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      // Email confirmation is disabled, so signup also returns an active session.
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(toJapaneseError(err, "ログインに失敗しました。"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <p className="bracket text-sm text-ash-gray mb-3">
        {mode === "login" ? "ログイン" : "新規登録"}
      </p>
      <h1 className="font-display font-semibold text-4xl tracking-tight mb-2">
        ヨソウ<span className="text-pulse-green">.</span>
      </h1>
      <p className="text-ash-gray mb-8 text-sm">
        新規登録で<span className="text-pulse-green">1,000ポイント</span>プレゼント。
      </p>

      <form onSubmit={submit} className="card p-6 space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-sm text-ash-gray mb-2">表示名</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-transparent border border-olive-stone rounded-[8px] px-4 py-3 focus:border-cream-glow outline-none"
              placeholder="予測家ネーム"
            />
          </div>
        )}
        <div>
          <label className="block text-sm text-ash-gray mb-2">メールアドレス</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border border-olive-stone rounded-[8px] px-4 py-3 focus:border-cream-glow outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-ash-gray mb-2">パスワード</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border border-olive-stone rounded-[8px] px-4 py-3 focus:border-cream-glow outline-none"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-ghost w-full">
          {loading ? "処理中…" : mode === "login" ? "ログイン" : "登録する"}
        </button>

        {error && <p className="text-sm text-ember-orange">{error}</p>}
      </form>

      <button
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setError(null);
        }}
        className="mt-4 text-sm text-ash-gray hover:text-cream-glow w-full inline-flex items-center justify-center gap-1"
      >
        {mode === "login"
          ? "アカウントをお持ちでない方はこちら"
          : "すでにアカウントをお持ちの方はこちら"}
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
