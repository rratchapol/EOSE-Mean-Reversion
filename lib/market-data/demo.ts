import type { Candle } from "@/lib/types";

function makeCandle(
  index: number,
  open: number,
  close: number,
  volume: number,
): Candle {
  const high = Math.max(open, close) + 0.03 + (index % 3) * 0.01;
  const low = Math.min(open, close) - 0.03 - (index % 2) * 0.01;
  return {
    time: new Date(Date.now() - (40 - index) * 60 * 60 * 1000).toISOString(),
    open,
    high,
    low,
    close,
    volume,
  };
}

export function getDemoCandles1h(): Candle[] {
  const closes = [
    6.25, 6.38, 6.5, 6.58, 6.7, 6.8, 6.96, 7.1, 7.02, 6.9, 6.72, 6.48, 6.22,
    6.05, 5.82, 5.6, 5.44, 5.28, 5.11, 4.92, 4.76, 4.63, 4.5, 4.42, 4.36,
    4.3, 4.26, 4.2, 4.18, 4.15, 4.12, 4.1, 4.08, 4.12, 4.16, 4.2, 4.18,
    4.22, 4.26, 4.3,
  ];

  return closes.map((close, index) => {
    const open = index === 0 ? close + 0.04 : closes[index - 1];
    return makeCandle(index, open, close, 820_000 + index * 18_000);
  });
}

export function getDemoCandles15m(): Candle[] {
  const closes = [
    4.45, 4.39, 4.32, 4.26, 4.2, 4.15, 4.1, 4.05, 4.02, 3.98, 3.95, 3.92,
    3.9, 3.88, 3.86, 3.84, 3.82, 3.8, 3.78, 3.76, 3.72, 3.7, 3.74, 3.86,
  ];

  return closes.map((close, index) => {
    const open = index === 0 ? close + 0.03 : closes[index - 1];
    const candle = makeCandle(index, open, close, 310_000 + index * 11_000);
    if (index === closes.length - 1) {
      return {
        ...candle,
        open: 3.69,
        close: 3.86,
        high: 3.9,
        low: 3.62,
        volume: 740_000,
      };
    }
    return candle;
  });
}
