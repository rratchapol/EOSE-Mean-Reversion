import type { Candle } from "@/lib/types";

type YahooChartResult = {
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: Array<number | null>;
      high?: Array<number | null>;
      low?: Array<number | null>;
      close?: Array<number | null>;
      volume?: Array<number | null>;
    }>;
  };
};

type YahooChartResponse = {
  chart?: {
    result?: YahooChartResult[];
    error?: { description?: string };
  };
};

function intervalRange(interval: "15m" | "1h", range?: string): string {
  if (range) return range;
  return interval === "15m" ? "5d" : "3mo";
}

export async function getYahooCandles(
  ticker: string,
  interval: "15m" | "1h",
  range?: string,
): Promise<Candle[]> {
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`);
  url.searchParams.set("interval", interval);
  url.searchParams.set("range", intervalRange(interval, range));
  url.searchParams.set("includePrePost", "false");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 EOSE Scanner",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed: ${response.status}`);
  }

  const body = (await response.json()) as YahooChartResponse;
  const error = body.chart?.error?.description;
  if (error) {
    throw new Error(`Yahoo Finance error: ${error}`);
  }

  const result = body.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  if (!result?.timestamp?.length || !quote) {
    throw new Error("Yahoo Finance returned no candles.");
  }

  return result.timestamp
    .map((timestamp, index) => ({
      time: new Date(timestamp * 1000).toISOString(),
      open: quote.open?.[index],
      high: quote.high?.[index],
      low: quote.low?.[index],
      close: quote.close?.[index],
      volume: quote.volume?.[index] ?? 0,
    }))
    .filter(
      (candle): candle is Candle =>
        candle.open !== null &&
        candle.open !== undefined &&
        candle.high !== null &&
        candle.high !== undefined &&
        candle.low !== null &&
        candle.low !== undefined &&
        candle.close !== null &&
        candle.close !== undefined,
    )
    .slice(-500);
}
