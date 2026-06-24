import type { Candle } from "@/lib/types";

export function atr(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) return 0;

  const trueRanges = candles.slice(1).map((candle, index) => {
    const previousClose = candles[index].close;
    return Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - previousClose),
      Math.abs(candle.low - previousClose),
    );
  });

  const values = trueRanges.slice(-period);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
