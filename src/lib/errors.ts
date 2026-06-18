const DEFAULT_MESSAGE =
  "問題が発生しました。時間をおいてもう一度お試しください。";

const ERROR_RULES: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "メールアドレスまたはパスワードが違います。"],
  [/email not confirmed/i, "メール認証が完了していません。"],
  [/user already registered|already.*registered/i, "このメールアドレスはすでに登録されています。"],
  [/password.*(?:at least|minimum|6)/i, "パスワードは6文字以上で入力してください。"],
  [/rate limit|too many/i, "アクセスが集中しています。少し時間をおいて再度お試しください。"],
  [/jwt|token|session/i, "ログイン状態を確認できませんでした。もう一度ログインしてください。"],
  [/forbidden|permission|not authorized|unauthorized|row-level security/i, "この操作を行う権限がありません。"],
  [/not found|no rows|missing/i, "対象のデータが見つかりませんでした。"],
  [/insufficient|balance|残高/i, "ポイント残高が不足しています。"],
  [/closed|not open|締め切/i, "このマーケットはすでに締め切られています。"],
  [/daily|bonus|already claimed|duplicate/i, "本日のボーナスはすでに受け取り済みです。"],
  [/network|fetch failed/i, "通信に失敗しました。接続を確認してもう一度お試しください。"],
];

function extractMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "";
}

export function toJapaneseError(
  error: unknown,
  fallback = DEFAULT_MESSAGE
): string {
  const message = extractMessage(error).trim();
  if (!message) return fallback;

  for (const [pattern, translated] of ERROR_RULES) {
    if (pattern.test(message)) return translated;
  }

  const looksEnglishOnly = /^[\x00-\x7F\s.,:;!?'"()[\]{}_\-/]+$/.test(message);
  return looksEnglishOnly ? fallback : message;
}
