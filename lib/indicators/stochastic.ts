import type { Candle } from "@/lib/types";

export type StochasticPoint = {
  k: number;
  d: number;
};

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function stochastic(
  candles: Candle[],
  period = 14,
  smoothK = 3,
  smoothD = 3,
): StochasticPoint[] {
  const rawK = candles.map((candle, index) => {
    if (index + 1 < period) return null;

    const slice = candles.slice(index + 1 - period, index + 1);
    const highestHigh = Math.max(...slice.map((item) => item.high));
    const lowestLow = Math.min(...slice.map((item) => item.low));
    const range = highestHigh - lowestLow;

    return range === 0 ? 50 : ((candle.close - lowestLow) / range) * 100;
  });

  return rawK.map((_, index) => {
    const kValues = rawK
      .slice(Math.max(0, index + 1 - smoothK), index + 1)
      .filter((value): value is number => value !== null);
    const k = kValues.length === smoothK ? average(kValues) : 50;
    const priorKs = rawK
      .slice(Math.max(0, index + 1 - smoothK - smoothD + 1), index + 1)
      .filter((value): value is number => value !== null);
    const d = priorKs.length >= smoothD ? average(priorKs.slice(-smoothD)) : 50;

    return { k, d };
  });
}
