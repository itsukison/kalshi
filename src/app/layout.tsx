import type { Metadata } from "next";
import { Inter_Tight, Noto_Sans_JP } from "next/font/google";
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
        <footer className="hairline w-full">
          <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-8 text-ash-gray text-sm leading-relaxed">
            <p className="bracket">遊び方</p>
            <p className="mt-2 max-w-2xl">
              ポイントはアプリ内のランキング専用です。購入・換金・譲渡・景品交換は一切できず、
              現実の金銭的価値を持ちません。本サービスは賭博には該当しません。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
