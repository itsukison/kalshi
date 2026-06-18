import type { Metadata } from "next";
import { Inter_Tight, Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const notoJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "ヨソウ — スポーツ予測マーケット",
  description:
    "ポイントで楽しむスポーツ予測マーケット。現金・景品との交換は一切ありません。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${interTight.variable} ${notoJp.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <NavBar />
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-5 md:px-8 py-10">
          {children}
        </main>
        <footer className="hairline mt-20 w-full">
          <div className="mx-auto max-w-[1280px] px-5 md:px-8">
            <div className="grid gap-10 py-12 md:grid-cols-[1.6fr_1fr_1fr]">
              <div>
                <p className="bracket text-sm text-ash-gray">遊び方</p>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-ash-gray">
                  YES か NO を選んでポイントを投じる予測マーケット。価格は需要で動き、的中すれば1枚あたり100ポイント。
                  ポイントはランキング・実績専用で、購入・換金・譲渡・景品交換は一切できず、現実の金銭的価値を持ちません。本サービスは賭博には該当しません。
                </p>
              </div>

              <nav className="flex flex-col gap-2.5 text-sm">
                <p className="bracket mb-1 text-xs text-ash-gray">メニュー</p>
                <Link href="/" className="text-ash-gray hover:text-cream-glow">
                  マーケット
                </Link>
                <Link href="/leaderboard" className="text-ash-gray hover:text-cream-glow">
                  ランキング
                </Link>
                <Link href="/account" className="text-ash-gray hover:text-cream-glow">
                  マイページ
                </Link>
              </nav>

              <nav className="flex flex-col gap-2.5 text-sm">
                <p className="bracket mb-1 text-xs text-ash-gray">サポート</p>
                <Link href="/support" className="text-ash-gray hover:text-cream-glow">
                  サポート
                </Link>
                <Link href="/privacy" className="text-ash-gray hover:text-cream-glow">
                  プライバシー
                </Link>
                <Link href="/terms" className="text-ash-gray hover:text-cream-glow">
                  利用条件
                </Link>
                <a
                  href="mailto:support@example.com"
                  className="text-ash-gray hover:text-cream-glow"
                >
                  お問い合わせ
                </a>
              </nav>
            </div>

            <div className="flex flex-col gap-2 border-t border-olive-stone py-5 text-xs text-ash-gray sm:flex-row sm:items-center sm:justify-between">
              <span>© 2026 ヨソウ. All rights reserved.</span>
              <span>Points have no monetary value — for play only.</span>
            </div>
          </div>

          <div className="overflow-hidden px-5 md:px-8">
            <p
              aria-hidden="true"
              className="select-none font-display font-semibold leading-[0.8] tracking-tight text-cream-glow"
              style={{ fontSize: "clamp(4rem, 24vw, 18rem)" }}
            >
              ヨソウ<span className="text-pulse-green">.</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
