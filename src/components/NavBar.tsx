import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import { MobileNav } from "@/components/MobileNav";
import { ResultToast } from "@/components/ResultToast";

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

  const balanceLabel = balance != null ? Math.round(balance).toLocaleString() : "—";

  return (
    <>
      {user && <ResultToast />}
      <nav className="sticky top-0 z-30 w-full border-b border-olive-stone bg-void-black">
      <div className="mx-auto flex min-h-16 max-w-[1280px] items-center justify-between gap-4 px-5 py-3 sm:py-0 md:px-8">
        {/* Logo + desktop links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-xl font-semibold tracking-tight">
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

        {/* Mobile: balance + hamburger drawer */}
        <div className="flex items-center gap-3 sm:hidden">
          {user && (
            <span className="text-sm text-ash-gray">
              <span className="font-display text-cream-glow tabular-nums">{balanceLabel}</span> pt
            </span>
          )}
          <MobileNav isLoggedIn={!!user} balanceLabel={balanceLabel} />
        </div>

        {/* Desktop right cluster */}
        <div className="hidden items-center gap-3 sm:flex">
          {user ? (
            <>
              <span className="text-sm text-ash-gray">
                残高{" "}
                <span className="font-display text-cream-glow tabular-nums">{balanceLabel}</span>{" "}
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
    </>
  );
}
