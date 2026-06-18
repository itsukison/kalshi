export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="bracket mb-3 text-sm text-ash-gray">サポート</p>
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        サポート
      </h1>
      <div className="mt-8 space-y-7 text-sm leading-relaxed text-cream-glow/90">
        <section>
          <h2 className="mb-2 text-lg font-semibold">問い合わせ</h2>
          <p>
            アカウント、ポイント、結果反映については{" "}
            <a href="mailto:support@example.com" className="text-pulse-green">
              support@example.com
            </a>{" "}
            までご連絡ください。
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">結果反映</h2>
          <p>
            試合終了後、結果取得と管理者確認が完了すると、的中分のポイントが残高と履歴に反映されます。
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">ポイント</h2>
          <p>
            ポイントはアプリ内のランキング・実績用です。購入、換金、譲渡、景品交換はできません。
          </p>
        </section>
      </div>
    </div>
  );
}
