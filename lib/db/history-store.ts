import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hasRedisEnv, redisLpushTrim, redisLrange } from "@/lib/db/redis-store";
import type { ScannerResult, StoredSignal } from "@/lib/types";

const dataDir = process.env.VERCEL ? path.join("/tmp", "eose-scanner") : path.join(process.cwd(), "data");
const historyPath = path.join(dataDir, "scanner-history.json");
const historyKey = "eose:scanner-history";

async function readHistoryFile(): Promise<StoredSignal[]> {
  try {
    const raw = await readFile(historyPath, "utf8");
    return JSON.parse(raw) as StoredSignal[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeHistoryFile(history: StoredSignal[]): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(historyPath, JSON.stringify(history, null, 2), "utf8");
}

export async function getSignalHistory(limit = 25): Promise<StoredSignal[]> {
  if (hasRedisEnv()) {
    return redisLrange<StoredSignal>(historyKey, 0, limit - 1);
  }

  const history = await readHistoryFile();
  return history
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}

export async function hasRecentSetupAlert(
  ticker: string,
  dedupMinutes: number,
): Promise<boolean> {
  const since = Date.now() - dedupMinutes * 60 * 1000;
  const history = await getSignalHistory(250);

  return history.some(
    (item) =>
      item.ticker === ticker &&
      item.status === "SETUP" &&
      item.alertSent &&
      Date.parse(item.createdAt) >= since,
  );
}

export async function saveSignal(
  scan: ScannerResult,
  alert: { sent: boolean; reason?: string },
): Promise<StoredSignal> {
  const item: StoredSignal = {
    id: `${scan.ticker}-${Date.now()}`,
    ticker: scan.ticker,
    status: scan.status,
    price: scan.price,
    rr: scan.tradePlan.rr,
    entry: scan.tradePlan.entry,
    stopLoss: scan.tradePlan.stopLoss,
    tp1: scan.tradePlan.tp1,
    tp2: scan.tradePlan.tp2,
    reasons: scan.reasons,
    createdAt: scan.lastScan,
    alertSent: alert.sent,
    alertReason: alert.reason,
  };

  if (hasRedisEnv()) {
    await redisLpushTrim(historyKey, item, 250);
    return item;
  }

  const history = await readHistoryFile();
  await writeHistoryFile([item, ...history].slice(0, 250));
  return item;
}
