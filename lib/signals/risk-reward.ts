import type { Candle, FvgZone, TradePlan } from "@/lib/types";

export function buildTradePlan(
  candles15m: Candle[],
  candles1h: Candle[],
  fvg: FvgZone | null,
): TradePlan {
  const trigger = candles15m.at(-1);
  if (!trigger) {
    throw new Error("Cannot build trade plan without 15M candles.");
  }

  const entry = trigger.close;
  const stopLoss = trigger.low * 0.985;
  const previousHigh = Math.max(...candles1h.slice(-18, -1).map((candle) => candle.high));
  const tp1 = Math.max(previousHigh, entry * 1.08);
  const tp2 = fvg ? Math.max(fvg.upper * 1.08, entry * 1.14) : entry * 1.14;
  const risk = entry - stopLoss;
  const reward = tp1 - entry;

  return {
    entry,
    stopLoss,
    tp1,
    tp2,
    riskPercent: ((entry - stopLoss) / entry) * 100,
    tp1Percent: ((tp1 - entry) / entry) * 100,
    tp2Percent: ((tp2 - entry) / entry) * 100,
    rr: risk > 0 ? reward / risk : 0,
  };
}
