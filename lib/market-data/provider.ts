import { getDemoCandles15m, getDemoCandles1h } from "@/lib/market-data/demo";
import { getTwelveDataCandles } from "@/lib/market-data/twelve-data";
import { getYahooCandles } from "@/lib/market-data/yahoo";
import type { Candle } from "@/lib/types";

export async function getCandles(
  ticker: string,
): Promise<{
  candles15m: Candle[];
  candles1h: Candle[];
  mode: "demo" | "twelve-data" | "yahoo";
}> {
  const mode = process.env.MARKET_DATA_MODE ?? "demo";

  if (mode === "yahoo") {
    const [candles15m, candles1h] = await Promise.all([
      getYahooCandles(ticker, "15m"),
      getYahooCandles(ticker, "1h"),
    ]);

    return { candles15m, candles1h, mode };
  }

  if (mode === "twelve-data") {
    const [candles15m, candles1h] = await Promise.all([
      getTwelveDataCandles(ticker, "15min"),
      getTwelveDataCandles(ticker, "1h"),
    ]);

    return { candles15m, candles1h, mode };
  }

  if (mode !== "demo") {
    throw new Error(
      `Market data mode "${mode}" is not implemented yet. Use MARKET_DATA_MODE=demo, yahoo, or twelve-data.`,
    );
  }

  return {
    candles15m: getDemoCandles15m(),
    candles1h: getDemoCandles1h(),
    mode: "demo",
  };
}
