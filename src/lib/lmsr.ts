/**
 * LMSR helpers for CLIENT-SIDE ESTIMATES ONLY.
 * The authoritative calculation lives in the Postgres `buy_contract` function.
 * Units: each contract pays out 100 points; internal "units" = points / 100.
 */

export function yesPriceFromQ(qYes: number, qNo: number, b: number): number {
  const p = Math.exp(qYes / b) / (Math.exp(qYes / b) + Math.exp(qNo / b));
  return clampPrice(Math.round(p * 100));
}

/** q_yes that produces a starting YES probability p0 (0..1), with q_no = 0. */
export function initialQYes(p0: number, b: number): number {
  const p = Math.min(0.99, Math.max(0.01, p0));
  return b * Math.log(p / (1 - p));
}

/** Estimate contracts received for spending `pointsSpent` on a side. */
export function estimateContracts(
  side: "YES" | "NO",
  pointsSpent: number,
  qYes: number,
  qNo: number,
  b: number
): { contracts: number; newYesPrice: number; avgPrice: number } {
  const units = pointsSpent / 100;
  const S = Math.exp(qYes / b) + Math.exp(qNo / b);
  let newQYes = qYes;
  let newQNo = qNo;
  let contracts: number;

  if (side === "YES") {
    contracts = b * Math.log(Math.exp(units / b) * S - Math.exp(qNo / b)) - qYes;
    newQYes = qYes + contracts;
  } else {
    contracts = b * Math.log(Math.exp(units / b) * S - Math.exp(qYes / b)) - qNo;
    newQNo = qNo + contracts;
  }

  return {
    contracts,
    newYesPrice: yesPriceFromQ(newQYes, newQNo, b),
    avgPrice: contracts > 0 ? pointsSpent / contracts : 0,
  };
}

export function clampPrice(p: number): number {
  return Math.max(1, Math.min(99, p));
}

/** Convert a list of decimal odds for mutually-exclusive outcomes into de-vigged probabilities. */
export function deVig(decimalOdds: number[]): number[] {
  const implied = decimalOdds.map((o) => 1 / o);
  const overround = implied.reduce((a, b) => a + b, 0);
  return implied.map((p) => p / overround);
}
