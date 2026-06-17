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
      <section className="mb-10">
        <p className="bracket text-sm text-ash-gray mb-3">FIFA World Cup</p>
        <h1 className="font-display font-semibold text-5xl md:text-6xl leading-[0.95] tracking-tight max-w-3xl">
          試合を<span className="text-pulse-green">予測</span>して、
          <br />
          ポイントを稼ごう。
        </h1>
        <p className="mt-5 text-ash-gray max-w-xl">
          YES か NO を選んでポイントを投じる予測マーケット。価格は需要で動き、的中すれば1枚あたり100ポイント。
        </p>
      </section>

      <MarketBrowser markets={(markets ?? []) as MarketWithMatch[]} />
    </div>
  );
}
