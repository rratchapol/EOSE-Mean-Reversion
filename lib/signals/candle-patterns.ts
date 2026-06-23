import type { Candle } from "@/lib/types";

export function isBullishEngulfing(candles: Candle[]): boolean {
  const previous = candles.at(-2);
  const current = candles.at(-1);
  if (!previous || !current) return false;

  return (
    previous.close < previous.open &&
    current.close > current.open &&
    current.open <= previous.close &&
    current.close >= previous.open
  );
}

export function isHammer(candles: Candle[]): boolean {
  const current = candles.at(-1);
  if (!current) return false;

  const body = Math.abs(current.close - current.open);
  const lowerWick = Math.min(current.open, current.close) - current.low;
  const upperWick = current.high - Math.max(current.open, current.close);

  return current.close > current.open && lowerWick >= body * 1.5 && upperWick <= body;
}

export function hasVolumeConfirmation(candles: Candle[]): boolean {
  const previous = candles.at(-2);
  const current = candles.at(-1);
  return Boolean(previous && current && current.volume > previous.volume);
}
