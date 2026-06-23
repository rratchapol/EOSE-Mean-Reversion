import { getCandles } from "@/lib/market-data/provider";
import { getNewsRisk } from "@/lib/news/news-risk";
import { evaluateSignal } from "@/lib/signals/evaluate-signal";
import type { ScannerResult } from "@/lib/types";

export async function runScanner(ticker: string): Promise<ScannerResult> {
  const { candles15m, candles1h, mode } = await getCandles(ticker);
  const price = candles15m.at(-1)?.close ?? candles1h.at(-1)?.close ?? 0;
  const newsRisk = await getNewsRisk(ticker);
  const evaluation = evaluateSignal({
    candles15m,
    candles1h,
    newsClean: newsRisk.clean,
    newsNote: newsRisk.note,
  });

  return {
    ticker,
    status: evaluation.status,
    price,
    lastScan: new Date().toISOString(),
    marketDataMode: mode,
    checklist: evaluation.checklist,
    tradePlan: evaluation.tradePlan,
    fvgZones: evaluation.fvg ? [evaluation.fvg] : [],
    reasons: evaluation.reasons,
    candles15m,
    candles1h,
  };
}
