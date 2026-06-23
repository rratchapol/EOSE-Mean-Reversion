import { describe, expect, it } from "vitest";
import { stochastic } from "@/lib/indicators/stochastic";
import type { Candle } from "@/lib/types";

function candle(close: number): Candle {
  return {
    time: new Date().toISOString(),
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1,
  };
}

describe("stochastic", () => {
  it("returns a point for every candle", () => {
    const candles = Array.from({ length: 20 }, (_, index) => candle(index + 1));

    expect(stochastic(candles)).toHaveLength(20);
  });
});
