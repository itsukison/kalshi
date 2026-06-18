export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="bracket mb-3 text-sm text-ash-gray">利用条件</p>
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        利用条件
      </h1>
      <div className="mt-8 space-y-7 text-sm leading-relaxed text-cream-glow/90">
        <section>
          <h2 className="mb-2 text-lg font-semibold">ポイントの性質</h2>
          <p>
            ポイントは現実の金銭的価値を持たず、購入、換金、譲渡、景品交換はできません。
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">マーケット</h2>
          <p>
            各マーケットは表示された決済ルールに基づき、試合結果の確認後に確定します。
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">禁止事項</h2>
          <p>
            不正アクセス、複数アカウントによる不正なポイント取得、サービス運営を妨げる行為を禁止します。
          </p>
        </section>
      </div>
    </div>
  );
}
