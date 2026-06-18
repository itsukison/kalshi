"use client";

import { useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import { toJapaneseError } from "@/lib/errors";

export function ShareButton({
  label = "シェア",
  title = "ヨソウ",
  text,
  url,
  className = "",
}: {
  label?: string;
  title?: string;
  text: string;
  url?: string;
  className?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const shareUrl = useMemo(() => {
    if (url) return url;
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, [url]);

  async function share() {
    setMessage(null);
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
        setMessage("シェアしました");
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      setMessage("リンクをコピーしました");
    } catch (error) {
      setMessage(toJapaneseError(error, "シェアに失敗しました。"));
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={share}
        className={`btn-ghost inline-flex items-center justify-center gap-2 text-sm ${className}`}
      >
        <Share2 size={16} />
        <span>{label}</span>
      </button>
      {message && <span className="text-xs text-ash-gray">{message}</span>}
    </div>
  );
}
