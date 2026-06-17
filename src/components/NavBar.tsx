import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let balance: number | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("points_balance")
      .eq("id", user.id)
      .single();
    balance = data ? Number(data.points_balance) : null;
  }

  return (
    <nav className="hairline-b w-full border-b border-olive-stone">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-7">
          <Link href="/" className="font-display font-semibold text-xl tracking-tight">
            ヨソウ<span className="text-pulse-green">.</span>
          </Link>
          <Link href="/" className="text-sm text-cream-glow/90 hover:text-cream-glow">
            マーケット
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm text-cream-glow/90 hover:text-cream-glow"
          >
            ランキング
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-ash-gray">
                残高{" "}
                <span className="font-display text-cream-glow tabular-nums">
                  {balance != null ? Math.round(balance).toLocaleString() : "—"}
                </span>{" "}
                pt
              </span>
              <Link href="/account" className="btn-ghost text-sm">
                マイページ
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn-ghost text-sm">
              ログイン
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
