import type { ScannerResult } from "@/lib/types";

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function buildLineMessage(scan: ScannerResult): string {
  return [
    `${scan.ticker} SETUP DETECTED`,
    "",
    `Price: ${money(scan.price)}`,
    `Entry: next 15M candle near ${money(scan.tradePlan.entry)}`,
    `SL: ${money(scan.tradePlan.stopLoss)} (-${scan.tradePlan.riskPercent.toFixed(1)}%)`,
    `TP1: ${money(scan.tradePlan.tp1)} (+${scan.tradePlan.tp1Percent.toFixed(1)}%)`,
    `TP2: ${money(scan.tradePlan.tp2)} (+${scan.tradePlan.tp2Percent.toFixed(1)}%)`,
    `RR: 1:${scan.tradePlan.rr.toFixed(2)}`,
    "",
    "Passed:",
    ...scan.checklist.filter((item) => item.passed).map((item) => `- ${item.label}`),
    "",
    "Risk: Check latest dilution/news before entry.",
  ].join("\n");
}

export async function sendLineAlert(
  scan: ScannerResult,
): Promise<{ sent: boolean; reason?: string }> {
  return sendLineText(buildLineMessage(scan));
}

export async function sendLineText(text: string): Promise<{ sent: boolean; reason?: string }> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;

  if (!token || !userId) {
    return {
      sent: false,
      reason: "LINE_CHANNEL_ACCESS_TOKEN or LINE_USER_ID is missing.",
    };
  }

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text }],
    }),
  });

  if (!response.ok) {
    return {
      sent: false,
      reason: await response.text(),
    };
  }

  return { sent: true };
}
