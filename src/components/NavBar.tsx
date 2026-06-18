import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";

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
      <div className="mx-auto flex min-h-16 max-w-[1280px] flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-0 md:px-8">
        <div className="flex min-w-0 items-center justify-between gap-4 sm:justify-start">
          <Link href="/" className="font-display font-semibold text-xl tracking-tight">
            ヨソウ<span className="text-pulse-green">.</span>
          </Link>
          <div className="hidden items-center gap-6 sm:flex">
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
        </div>

        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 sm:mx-0 sm:justify-end sm:px-0">
          <Link
            href="/"
            className="shrink-0 rounded-[100px] border border-olive-stone px-3 py-2 text-sm text-cream-glow/90 hover:border-cream-glow sm:hidden"
          >
            マーケット
          </Link>
          <Link
            href="/leaderboard"
            className="shrink-0 rounded-[100px] border border-olive-stone px-3 py-2 text-sm text-cream-glow/90 hover:border-cream-glow sm:hidden"
          >
            ランキング
          </Link>
          {user ? (
            <>
              <span className="shrink-0 text-sm text-ash-gray">
                残高{" "}
                <span className="font-display text-cream-glow tabular-nums">
                  {balance != null ? Math.round(balance).toLocaleString() : "—"}
                </span>{" "}
                pt
              </span>
              <Link href="/account" className="btn-ghost text-sm">
                マイページ
              </Link>
              <LogoutButton />
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
