import { atr } from "@/lib/indicators/atr";
import { getYahooCandles } from "@/lib/market-data/yahoo";
import { getNewsRisk } from "@/lib/news/news-risk";
import type { Candle } from "@/lib/types";

type DailyRangeResult = {
  ticker: string;
  price: number;
  bias: "BULLISH" | "NEUTRAL" | "BEARISH" | "AVOID";
  confidence: "LOW" | "MEDIUM" | "HIGH";
  atr14: number;
  conservative: { low: number; high: number };
  expected: { low: number; high: number };
  extreme: { low: number; high: number };
  support: number[];
  resistance: number[];
  reasons: string[];
  newsNote: string;
  createdAt: string;
};

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

function recentLevels(candles: Candle[], type: "support" | "resistance"): number[] {
  const values = candles
    .slice(-30)
    .map((candle) => (type === "support" ? candle.low : candle.high))
    .sort((a, b) => (type === "support" ? a - b : b - a));

  return [...new Set(values.map(roundPrice))].slice(0, 3);
}

function trendBias(candles1h: Candle[]): "BULLISH" | "NEUTRAL" | "BEARISH" {
  const recent = candles1h.slice(-8);
  const first = recent.at(0);
  const last = recent.at(-1);
  if (!first || !last) return "NEUTRAL";

  const change = (last.close - first.close) / first.close;
  if (change > 0.025) return "BULLISH";
  if (change < -0.025) return "BEARISH";
  return "NEUTRAL";
}

function thaiBias(bias: DailyRangeResult["bias"]): string {
  const labels = {
    BULLISH: "เอนขึ้น",
    NEUTRAL: "กลาง ๆ",
    BEARISH: "เอนลง",
    AVOID: "หลีกเลี่ยง",
  };
  return labels[bias];
}

function thaiConfidence(confidence: DailyRangeResult["confidence"]): string {
  const labels = {
    LOW: "ต่ำ",
    MEDIUM: "ปานกลาง",
    HIGH: "สูง",
  };
  return labels[confidence];
}

export async function buildDailyRange(ticker = "EOSE"): Promise<DailyRangeResult> {
  const [daily, candles1h, candles15m, newsRisk] = await Promise.all([
    getYahooCandles(ticker, "1d", "6mo"),
    getYahooCandles(ticker, "1h", "1mo"),
    getYahooCandles(ticker, "15m", "5d"),
    getNewsRisk(ticker),
  ]);
  const latest = candles15m.at(-1) ?? daily.at(-1);
  const previousDay = daily.at(-2) ?? daily.at(-1);
  if (!latest || !previousDay) {
    throw new Error("Not enough candles to build daily range.");
  }

  const atr14 = atr(daily);
  const price = latest.close;
  const technicalBias = trendBias(candles1h);
  const bias = !newsRisk.clean ? "AVOID" : technicalBias;
  const downsideFactor = !newsRisk.clean ? 1.25 : technicalBias === "BEARISH" ? 1.05 : 0.8;
  const upsideFactor = !newsRisk.clean ? 0.55 : technicalBias === "BULLISH" ? 1.05 : 0.8;
  const expectedLow = Math.min(previousDay.low, price - atr14 * downsideFactor);
  const expectedHigh = Math.max(previousDay.high, price + atr14 * upsideFactor);
  const conservativeLow = Math.max(0, price - atr14 * 0.45 * downsideFactor);
  const conservativeHigh = price + atr14 * 0.45 * upsideFactor;
  const extremeLow = Math.min(Math.max(0, price - atr14 * 1.7 * downsideFactor), expectedLow);
  const extremeHigh = Math.max(price + atr14 * 1.7 * upsideFactor, expectedHigh);

  return {
    ticker,
    price: roundPrice(price),
    bias,
    confidence: newsRisk.clean ? "MEDIUM" : "LOW",
    atr14: roundPrice(atr14),
    conservative: { low: roundPrice(conservativeLow), high: roundPrice(conservativeHigh) },
    expected: { low: roundPrice(expectedLow), high: roundPrice(expectedHigh) },
    extreme: { low: roundPrice(extremeLow), high: roundPrice(extremeHigh) },
    support: recentLevels(candles1h, "support"),
    resistance: recentLevels(candles1h, "resistance"),
    reasons: [
      `ตัวกรองข่าว: ${newsRisk.clean ? "ไม่พบความเสี่ยง" : "พบข่าว/filing เสี่ยง"}`,
      `แนวโน้ม 1H: ${thaiBias(technicalBias)}`,
      `ATR14 รายวัน: $${roundPrice(atr14).toFixed(2)}`,
      `วันก่อนหน้า: low $${previousDay.low.toFixed(2)} / high $${previousDay.high.toFixed(2)}`,
    ],
    newsNote: newsRisk.note,
    createdAt: new Date().toISOString(),
  };
}

export function buildDailyRangeLineMessage(range: DailyRangeResult): string {
  return [
    `${range.ticker} ประเมินกรอบราคาประจำวัน`,
    "",
    `ราคาล่าสุด: $${range.price.toFixed(2)}`,
    `มุมมอง: ${thaiBias(range.bias)}`,
    `ความมั่นใจ: ${thaiConfidence(range.confidence)}`,
    `ATR14 รายวัน: $${range.atr14.toFixed(2)}`,
    "",
    `กรอบแคบ: $${range.conservative.low.toFixed(2)} - $${range.conservative.high.toFixed(2)}`,
    `กรอบคาดหวัง: $${range.expected.low.toFixed(2)} - $${range.expected.high.toFixed(2)}`,
    `กรอบสุดโต่ง: $${range.extreme.low.toFixed(2)} - $${range.extreme.high.toFixed(2)}`,
    "",
    `แนวรับ: ${range.support.map((value) => `$${value.toFixed(2)}`).join(", ")}`,
    `แนวต้าน: ${range.resistance.map((value) => `$${value.toFixed(2)}`).join(", ")}`,
    "",
    "เหตุผล:",
    ...range.reasons.map((reason) => `- ${reason}`),
    "",
    `ข่าว: ${range.newsNote}`,
    "",
    "ใช้เป็นกรอบประเมิน ไม่ใช่การการันตี high/low",
  ].join("\n");
}
