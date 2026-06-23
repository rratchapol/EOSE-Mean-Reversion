import { sendLineAlert } from "@/lib/alerts/line";
import { hasRecentSetupAlert, saveSignal } from "@/lib/db/history-store";
import { runScanner } from "@/lib/signals/signal-engine";

function dedupMinutes(): number {
  const value = Number(process.env.ALERT_DEDUP_MINUTES ?? 60);
  return Number.isFinite(value) && value > 0 ? value : 60;
}

export async function scanAndMaybeAlert(ticker = "EOSE") {
  const scan = await runScanner(ticker);
  let alert: { sent: boolean; reason?: string } = {
    sent: false,
    reason: `Current status is ${scan.status}`,
  };

  if (scan.status === "SETUP") {
    const duplicate = await hasRecentSetupAlert(scan.ticker, dedupMinutes());
    alert = duplicate
      ? { sent: false, reason: "Duplicate SETUP alert suppressed." }
      : await sendLineAlert(scan);
  }

  const stored = await saveSignal(scan, alert);
  return { scan, alert, stored };
}
