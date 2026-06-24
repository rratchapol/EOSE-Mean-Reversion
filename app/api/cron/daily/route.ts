import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron/auth";
import { isPacificNoon, isUsMarketHours } from "@/lib/cron/market-hours";
import { scanAndMaybeAlert } from "@/lib/workers/scan-and-alert";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, reason: "Unauthorized" }, { status: 401 });
  }

  if (isUsMarketHours()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Market is open" });
  }

  if (!isPacificNoon()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Not noon Pacific time" });
  }

  const result = await scanAndMaybeAlert("EOSE");
  return NextResponse.json({ ok: true, ...result });
}
