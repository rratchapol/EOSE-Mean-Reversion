import type { Candle, FvgZone } from "@/lib/types";

export function findBullishFvgs(candles: Candle[]): FvgZone[] {
  const zones: FvgZone[] = [];

  for (let index = 0; index < candles.length - 2; index += 1) {
    const first = candles[index];
    const third = candles[index + 2];

    if (first.high < third.low) {
      zones.push({
        lower: first.high,
        upper: third.low,
        createdAt: third.time,
        status: "open",
      });
    }
  }

  return zones.map((zone) => {
    const laterCandles = candles.filter((candle) => candle.time > zone.createdAt);
    const touched = laterCandles.some((candle) => candle.low <= zone.upper);
    const filled = laterCandles.some((candle) => candle.low <= zone.lower);

    return {
      ...zone,
      status: filled ? "filled" : touched ? "touched" : "open",
    };
  });
}

export function getNearestActiveFvg(candles: Candle[]): FvgZone | null {
  const price = candles.at(-1)?.close;
  if (!price) return null;

  const active = findBullishFvgs(candles).filter((zone) => zone.status !== "filled");
  return (
    active
      .sort((a, b) => Math.abs(price - a.upper) - Math.abs(price - b.upper))
      .at(0) ?? null
  );
}

export function isPriceInsideOrNearFvg(price: number, zone: FvgZone | null): boolean {
  if (!zone) return false;
  const tolerance = price * 0.015;
  return price >= zone.lower - tolerance && price <= zone.upper + tolerance;
}
