import { describe, expect, it } from "vitest";
import { findBullishFvgs } from "@/lib/signals/fvg";
import type { Candle } from "@/lib/types";

function candle(index: number, high: number, low: number): Candle {
  return {
    time: new Date(2026, 0, index + 1).toISOString(),
    open: low,
    high,
    low,
    close: high,
    volume: 1,
  };
}

describe("findBullishFvgs", () => {
  it("detects bullish three-candle gaps", () => {
    const zones = findBullishFvgs([
      candle(0, 10, 9),
      candle(1, 11, 10),
      candle(2, 13, 12),
      candle(3, 14, 13),
    ]);

    expect(zones[0]).toMatchObject({ lower: 10, upper: 12 });
  });
});
