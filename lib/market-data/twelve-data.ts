import type { Candle } from "@/lib/types";

type TwelveDataValue = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
};

type TwelveDataResponse = {
  values?: TwelveDataValue[];
  status?: string;
  message?: string;
};

function toCandle(value: TwelveDataValue): Candle {
  return {
    time: new Date(value.datetime).toISOString(),
    open: Number(value.open),
    high: Number(value.high),
    low: Number(value.low),
    close: Number(value.close),
    volume: Number(value.volume ?? 0),
  };
}

export async function getTwelveDataCandles(
  ticker: string,
  interval: "15min" | "1h",
  outputsize = 80,
): Promise<Candle[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("TWELVE_DATA_API_KEY is required when MARKET_DATA_MODE=twelve-data.");
  }

  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", ticker);
  url.searchParams.set("interval", interval);
  url.searchParams.set("outputsize", String(outputsize));
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url, { next: { revalidate: 60 } });
  if (!response.ok) {
    throw new Error(`Twelve Data request failed: ${response.status}`);
  }

  const body = (await response.json()) as TwelveDataResponse;
  if (!body.values?.length) {
    throw new Error(body.message ?? "Twelve Data returned no candles.");
  }

  return body.values.map(toCandle).reverse();
}
