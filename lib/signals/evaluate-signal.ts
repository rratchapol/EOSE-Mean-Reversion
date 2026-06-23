import { stochastic } from "@/lib/indicators/stochastic";
import {
  hasVolumeConfirmation,
  isBullishEngulfing,
  isHammer,
} from "@/lib/signals/candle-patterns";
import { getNearestActiveFvg, isPriceInsideOrNearFvg } from "@/lib/signals/fvg";
import { buildTradePlan } from "@/lib/signals/risk-reward";
import type { Candle, ChecklistItem, FvgZone, SignalStatus, TradePlan } from "@/lib/types";

function format(value: number): string {
  return value.toFixed(2);
}

export type SignalEvaluation = {
  status: SignalStatus;
  checklist: ChecklistItem[];
  tradePlan: TradePlan;
  fvg: FvgZone | null;
  reasons: string[];
};

export function evaluateSignal({
  candles15m,
  candles1h,
  newsClean,
  newsNote,
}: {
  candles15m: Candle[];
  candles1h: Candle[];
  newsClean: boolean;
  newsNote: string;
}): SignalEvaluation {
  const latest1hStoch = stochastic(candles1h).at(-1) ?? { k: 50, d: 50 };
  const latest15mStoch = stochastic(candles15m).at(-1) ?? { k: 50, d: 50 };
  const price = candles15m.at(-1)?.close ?? candles1h.at(-1)?.close ?? 0;
  const activeFvg = getNearestActiveFvg(candles1h);
  const insideFvg = isPriceInsideOrNearFvg(price, activeFvg);
  const bullishEngulfing = isBullishEngulfing(candles15m);
  const hammer = isHammer(candles15m);
  const volumeConfirmed = hasVolumeConfirmation(candles15m);
  const tradePlan = buildTradePlan(candles15m, candles1h, activeFvg);
  const stochOversold = latest1hStoch.k < 20 && latest1hStoch.d < 20;
  const triggerFound = bullishEngulfing || hammer || latest15mStoch.k > latest15mStoch.d;
  const rrPassed = tradePlan.rr >= 2;

  const checklist: ChecklistItem[] = [
    {
      label: "1H Stochastic oversold",
      passed: stochOversold,
      detail: `%K ${format(latest1hStoch.k)} / %D ${format(latest1hStoch.d)}`,
    },
    {
      label: "Price inside or near bullish FVG",
      passed: insideFvg,
      detail: activeFvg
        ? `$${format(activeFvg.lower)} - $${format(activeFvg.upper)}`
        : "No active 1H FVG found",
    },
    {
      label: "15M bullish trigger",
      passed: triggerFound,
      detail: bullishEngulfing
        ? "Bullish engulfing"
        : hammer
          ? "Hammer / pin bar"
          : `%K ${format(latest15mStoch.k)} vs %D ${format(latest15mStoch.d)}`,
    },
    {
      label: "Volume confirmation",
      passed: volumeConfirmed,
      detail: "Trigger candle volume is higher than previous candle",
    },
    {
      label: "RR at least 1:2",
      passed: rrPassed,
      detail: `RR ${format(tradePlan.rr)}`,
    },
    {
      label: "News risk filter",
      passed: newsClean,
      detail: newsNote,
    },
  ];

  let status: SignalStatus = "WAIT";
  if (!newsClean) {
    status = "AVOID";
  } else if (stochOversold && insideFvg && triggerFound && volumeConfirmed && rrPassed) {
    status = "SETUP";
  } else if (stochOversold && insideFvg) {
    status = "WATCH";
  }

  return {
    status,
    checklist,
    tradePlan,
    fvg: activeFvg,
    reasons: checklist.filter((item) => item.passed).map((item) => `${item.label}: ${item.detail}`),
  };
}
