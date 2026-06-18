import { createClient } from "@/lib/supabase/server";
import { MarketBrowser } from "@/components/MarketBrowser";
import type { MarketWithMatch } from "@/components/MarketCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: markets } = await supabase
    .from("markets")
    .select("*, matches(*)")
    .order("closes_at", { ascending: true });

  return (
    <div>
      <section className="mb-8 sm:mb-10">
        <p className="bracket mb-3 text-sm text-ash-gray">FIFA World Cup</p>
        <h1 className="max-w-3xl font-display text-[clamp(2.25rem,10vw,3rem)] font-semibold leading-[1.02] tracking-tight md:text-6xl md:leading-[0.95]">
          <span className="block whitespace-nowrap">
            試合を<span className="text-pulse-green">予測</span>して、
          </span>
          <span className="block whitespace-nowrap">ポイントを稼ごう。</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-[1.4] text-ash-gray sm:mt-5 sm:text-base">
          YES か NO を選んでポイントを投じる予測マーケット。価格は需要で動き、的中すれば1枚あたり100ポイント。
        </p>
      </section>

      <MarketBrowser markets={(markets ?? []) as MarketWithMatch[]} />
    </div>
  );
}
