import { getYahooCandles } from "@/lib/market-data/yahoo";
import { evaluateSignal } from "@/lib/signals/evaluate-signal";
import type { Candle } from "@/lib/types";

export type BacktestTrade = {
  setupTime: string;
  entryTime: string;
  exitTime: string;
  entry: number;
  stopLoss: number;
  target: number;
  result: "TP1" | "SL" | "OPEN";
  returnPercent: number;
  rr: number;
};

export type BacktestResult = {
  ticker: string;
  range: string;
  trades: BacktestTrade[];
  summary: {
    totalTrades: number;
    wins: number;
    losses: number;
    open: number;
    winRate: number;
    averageReturn: number;
    totalReturn: number;
    bestTrade: number;
    worstTrade: number;
  };
};

function candlesUpTo(candles: Candle[], time: string): Candle[] {
  const timestamp = Date.parse(time);
  return candles.filter((candle) => Date.parse(candle.time) <= timestamp);
}

function findExit(
  futureCandles: Candle[],
  stopLoss: number,
  target: number,
): Pick<BacktestTrade, "exitTime" | "result" | "returnPercent"> {
  for (const candle of futureCandles) {
    const hitStop = candle.low <= stopLoss;
    const hitTarget = candle.high >= target;

    if (hitStop && hitTarget) {
      return {
        exitTime: candle.time,
        result: "SL",
        returnPercent: 0,
      };
    }

    if (hitStop) {
      return {
        exitTime: candle.time,
        result: "SL",
        returnPercent: 0,
      };
    }

    if (hitTarget) {
      return {
        exitTime: candle.time,
        result: "TP1",
        returnPercent: 0,
      };
    }
  }

  return {
    exitTime: futureCandles.at(-1)?.time ?? new Date().toISOString(),
    result: "OPEN",
    returnPercent: 0,
  };
}

function summarize(trades: BacktestTrade[]): BacktestResult["summary"] {
  const closed = trades.filter((trade) => trade.result !== "OPEN");
  const wins = trades.filter((trade) => trade.result === "TP1").length;
  const losses = trades.filter((trade) => trade.result === "SL").length;
  const returns = trades.map((trade) => trade.returnPercent);

  return {
    totalTrades: trades.length,
    wins,
    losses,
    open: trades.length - closed.length,
    winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
    averageReturn:
      returns.length > 0 ? returns.reduce((sum, value) => sum + value, 0) / returns.length : 0,
    totalReturn: returns.reduce((sum, value) => sum + value, 0),
    bestTrade: returns.length > 0 ? Math.max(...returns) : 0,
    worstTrade: returns.length > 0 ? Math.min(...returns) : 0,
  };
}

export async function runBacktest(ticker = "EOSE", range = "60d"): Promise<BacktestResult> {
  const dayMatch = range.match(/^(\d+)d$/);
  if (dayMatch && Number(dayMatch[1]) > 60) {
    throw new Error(
      `Yahoo 15m candles usually support up to 60d. Use 60d or less, got ${range}.`,
    );
  }

  const [candles15m, candles1h] = await Promise.all([
    getYahooCandles(ticker, "15m", range),
    getYahooCandles(ticker, "1h", range),
  ]);
  const trades: BacktestTrade[] = [];
  let cooldownUntil = 0;

  for (let index = 60; index < candles15m.length - 1; index += 1) {
    const setupCandle = candles15m[index];
    const setupTime = Date.parse(setupCandle.time);
    if (setupTime < cooldownUntil) continue;

    const history15m = candles15m.slice(0, index + 1);
    const history1h = candlesUpTo(candles1h, setupCandle.time);
    if (history1h.length < 30) continue;

    const evaluation = evaluateSignal({
      candles15m: history15m,
      candles1h: history1h,
      newsClean: true,
      newsNote: "Backtest ignores point-in-time news filter.",
    });

    if (evaluation.status !== "SETUP") continue;

    const entryCandle = candles15m[index + 1];
    const entry = entryCandle.open;
    const stopLoss = evaluation.tradePlan.stopLoss;
    const target = evaluation.tradePlan.tp1;
    const futureCandles = candles15m.slice(index + 1, index + 1 + 24);
    const exit = findExit(futureCandles, stopLoss, target);
    const exitPrice = exit.result === "TP1" ? target : exit.result === "SL" ? stopLoss : futureCandles.at(-1)?.close ?? entry;
    const returnPercent = ((exitPrice - entry) / entry) * 100;

    trades.push({
      setupTime: setupCandle.time,
      entryTime: entryCandle.time,
      exitTime: exit.exitTime,
      entry,
      stopLoss,
      target,
      result: exit.result,
      returnPercent,
      rr: evaluation.tradePlan.rr,
    });

    cooldownUntil = Date.parse(entryCandle.time) + 60 * 60 * 1000;
  }

  return {
    ticker,
    range,
    trades,
    summary: summarize(trades),
  };
}
