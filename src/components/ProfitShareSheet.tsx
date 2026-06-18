"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Download, Image as ImageIcon, Share2, X } from "lucide-react";
import { toBlob } from "html-to-image";
import { formatPoints } from "@/lib/format";
import { toJapaneseError } from "@/lib/errors";
import { teamFlag } from "@/lib/teamFlags";

type ThemeKey = "neon" | "night" | "blue";

export type ProfitShareData = {
  homeTeam: string;
  awayTeam: string;
  league?: string | null;
  question: string;
  userSide: string;
  resolvedOutcome: "YES" | "NO";
  homeScore?: number | null;
  awayScore?: number | null;
  stake: number;
  payout: number;
  profit: number;
  contracts: number;
};

const THEMES: Record<
  ThemeKey,
  {
    label: string;
    shell: string;
    card: string;
    accent: string;
    chip: string;
  }
> = {
  neon: {
    label: "Neon",
    shell: "bg-[#0e100f]",
    card: "linear-gradient(160deg, #fffce1 0%, #0ae448 48%, #11130f 100%)",
    accent: "#0ae448",
    chip: "bg-pulse-green",
  },
  night: {
    label: "Night",
    shell: "bg-[#15161d]",
    card: "linear-gradient(160deg, #9d95ff 0%, #171923 52%, #050506 100%)",
    accent: "#9d95ff",
    chip: "bg-electric-violet",
  },
  blue: {
    label: "Blue",
    shell: "bg-[#061014]",
    card: "linear-gradient(160deg, #00bae2 0%, #0b2730 52%, #020708 100%)",
    accent: "#00bae2",
    chip: "bg-signal-blue",
  },
};

function scoreLine(data: ProfitShareData): string {
  if (data.homeScore == null || data.awayScore == null) return "結果確定";
  return `${data.homeScore} - ${data.awayScore}`;
}

function outcomeLabel(data: ProfitShareData): string {
  return data.profit > 0 ? "的中" : data.profit === 0 ? "トントン" : "不的中";
}

function signedPoints(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatPoints(Math.abs(value))}`;
}

export function ProfitShareSheet({
  data,
  buttonLabel = "利益をシェア",
  className = "",
}: {
  data: ProfitShareData;
  buttonLabel?: string;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeKey>("neon");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const shareText = useMemo(
    () =>
      `ヨソウで${data.homeTeam} vs ${data.awayTeam}を${data.userSide}予測。損益 ${signedPoints(
        data.profit
      )} pt。`,
    [data]
  );

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const generateImage = useCallback(async (cancelled = false) => {
    if (!cardRef.current) return null;
    setGenerating(true);
    setMessage(null);
    try {
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#0e100f",
      });
      if (!blob || cancelled) return null;
      const url = URL.createObjectURL(blob);
      setImageBlob(blob);
      setImageUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return url;
      });
      return blob;
    } catch (error) {
      setMessage(toJapaneseError(error, "画像の作成に失敗しました。"));
      return null;
    } finally {
      if (!cancelled) setGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      await generateImage(cancelled);
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [generateImage, open, theme]);

  async function shareImage() {
    setMessage(null);
    const blob = imageBlob ?? (await generateImage());
    if (!blob) return;

    const file = new File([blob], "yosou-result.png", { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "ヨソウの試合結果",
          text: shareText,
          files: [file],
        });
        setMessage("画像をシェアしました");
        return;
      }
      downloadImage(blob);
      setMessage("画像を保存しました");
    } catch (error) {
      setMessage(toJapaneseError(error, "シェアに失敗しました。"));
    }
  }

  function downloadImage(blob = imageBlob) {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "yosou-result.png";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`btn-ghost inline-flex items-center justify-center gap-2 text-sm ${className}`}
      >
        <Share2 size={16} />
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-black/75 px-3 pb-3 pt-12 backdrop-blur-sm md:items-center md:p-6">
          <button
            type="button"
            aria-label="閉じる"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default"
          />
          <div className="relative max-h-[94vh] w-full max-w-[520px] overflow-y-auto rounded-[18px] border border-olive-stone bg-[#1a1b19] p-4 shadow-2xl md:p-5">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-cream-glow/60" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-ash-gray">シェア画像</p>
                <h2 className="text-xl font-semibold">試合後の利益を自慢</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-full border border-olive-stone text-ash-gray transition-colors hover:text-cream-glow"
                aria-label="閉じる"
              >
                <X size={18} />
              </button>
            </div>

            <div className={`rounded-[18px] p-3 ${THEMES[theme].shell}`}>
              <ShareCard cardRef={cardRef} data={data} theme={theme} />
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key)}
                  aria-label={`${THEMES[key].label} テーマ`}
                  className={`size-11 rounded-full border-2 ${
                    theme === key ? "border-cream-glow" : "border-olive-stone"
                  } ${THEMES[key].chip}`}
                />
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={shareImage}
                disabled={generating}
                className="btn-ghost gap-2 text-sm"
              >
                <ImageIcon size={16} />
                {generating ? "作成中…" : "画像でシェア"}
              </button>
              <button
                type="button"
                onClick={() => downloadImage()}
                disabled={!imageBlob || generating}
                className="inline-flex items-center justify-center gap-2 rounded-[100px] border border-olive-stone px-4 py-2 text-sm text-cream-glow transition-colors hover:border-cream-glow disabled:opacity-40"
              >
                <Download size={16} />
                保存
              </button>
            </div>
            {message && <p className="mt-3 text-center text-sm text-ash-gray">{message}</p>}
          </div>
        </div>
      )}
    </>
  );
}

const ShareCard = ({
  data,
  theme,
  cardRef,
}: {
  data: ProfitShareData;
  theme: ThemeKey;
  cardRef: RefObject<HTMLDivElement | null>;
}) => {
  const selectedTheme = THEMES[theme];
  const positive = data.profit > 0;
  return (
    <div
      ref={cardRef}
      style={{ background: selectedTheme.card }}
      className="relative mx-auto aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-[14px] p-5 text-void-black"
    >
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-void-black/70">
          <span>YOSOU RESULT</span>
          <span>ヨソウ.</span>
        </div>

        <div className="mt-7 rounded-[14px] bg-black/72 p-4 text-cream-glow shadow-xl backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <TeamFlag flag={teamFlag(data.homeTeam)} name={data.homeTeam} />
            <div className="text-center">
              <p className="text-xs text-cream-glow/60">{data.league ?? "Match"}</p>
              <p className="font-display text-3xl tabular-nums">{scoreLine(data)}</p>
            </div>
            <TeamFlag flag={teamFlag(data.awayTeam)} name={data.awayTeam} />
          </div>
        </div>

        <div className="mt-auto">
          <p className="text-sm font-semibold text-cream-glow/80">{outcomeLabel(data)}</p>
          <p className="mt-1 font-display text-[4rem] leading-none tracking-normal text-cream-glow">
            {signedPoints(data.profit)}
          </p>
          <p className="text-xl font-semibold text-cream-glow">pt</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric label="予測" value={data.userSide} />
            <Metric label="結果" value={data.resolvedOutcome} />
            <Metric label="投入" value={`${formatPoints(data.stake)} pt`} />
            <Metric label="払戻" value={`${formatPoints(data.payout)} pt`} />
          </div>

          <div className="mt-4 rounded-[12px] bg-black/62 p-3 text-cream-glow">
            <p className="text-xs text-cream-glow/60">QUESTION</p>
            <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
              {data.question}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-cream-glow/70">
            <span>{positive ? "利益をシェア" : "次こそ当てる"}</span>
            <span style={{ color: selectedTheme.accent }}>yosou.app</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function TeamFlag({ flag, name }: { flag: string; name: string }) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <div className="text-5xl leading-none">{flag}</div>
      <p className="mt-2 truncate text-xs font-semibold text-cream-glow/80">{name}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-black/62 p-3 text-cream-glow">
      <p className="text-[10px] text-cream-glow/55">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
