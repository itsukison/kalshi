export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="bracket mb-3 text-sm text-ash-gray">プライバシー</p>
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        プライバシーポリシー
      </h1>
      <div className="mt-8 space-y-7 text-sm leading-relaxed text-cream-glow/90">
        <section>
          <h2 className="mb-2 text-lg font-semibold">取得する情報</h2>
          <p>
            アカウント作成時のメールアドレス、表示名、予測履歴、ポイント履歴、
            ランキング表示に必要なプロフィール情報を扱います。
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">利用目的</h2>
          <p>
            ログイン、ポイント残高の管理、予測結果の表示、ランキング、サポート対応、
            不正利用の防止のために利用します。
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">第三者提供</h2>
          <p>
            法令に基づく場合を除き、個人を特定できる情報を本人の同意なく第三者に提供しません。
          </p>
        </section>
      </div>
    </div>
  );
}
