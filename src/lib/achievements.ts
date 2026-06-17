/** Badge / achievement definitions derived from a user's stats. */

export interface AchievementStats {
  predictionCount: number;
  correctCount: number;
  accuracy: number; // 0..1
  balance: number;
  biggestWin: number;
  tradeCount: number;
}

/** `icon` is a key resolved to a lucide-react component in the UI layer. */
export type BadgeIcon =
  | "target"
  | "sparkles"
  | "flame"
  | "trophy"
  | "brain"
  | "gem"
  | "crown";

export interface Badge {
  id: string;
  icon: BadgeIcon;
  label: string;
  description: string;
  earned: boolean;
}

export function computeBadges(s: AchievementStats): Badge[] {
  return [
    {
      id: "first_prediction",
      icon: "target",
      label: "はじめての予測",
      description: "初めて予測を購入する",
      earned: s.tradeCount >= 1,
    },
    {
      id: "first_win",
      icon: "sparkles",
      label: "初勝利",
      description: "予測を1回的中させる",
      earned: s.correctCount >= 1,
    },
    {
      id: "regular",
      icon: "flame",
      label: "常連",
      description: "10回以上予測する",
      earned: s.predictionCount >= 10,
    },
    {
      id: "veteran",
      icon: "trophy",
      label: "百戦錬磨",
      description: "50回以上予測する",
      earned: s.predictionCount >= 50,
    },
    {
      id: "sharp",
      icon: "brain",
      label: "予測の達人",
      description: "10回以上で的中率70%以上",
      earned: s.predictionCount >= 10 && s.accuracy >= 0.7,
    },
    {
      id: "jackpot",
      icon: "gem",
      label: "一攫千金",
      description: "1回の的中で5,000pt以上を獲得",
      earned: s.biggestWin >= 5000,
    },
    {
      id: "tycoon",
      icon: "crown",
      label: "大富豪",
      description: "残高5,000pt以上に到達",
      earned: s.balance >= 5000,
    },
  ];
}
