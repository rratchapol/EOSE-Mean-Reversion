import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron/auth";
import { isUsMarketHours } from "@/lib/cron/market-hours";
import { scanAndMaybeAlert } from "@/lib/workers/scan-and-alert";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, reason: "Unauthorized" }, { status: 401 });
  }

  if (!isUsMarketHours()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Outside US market hours" });
  }

  try {
    const result = await scanAndMaybeAlert("EOSE");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: error instanceof Error ? error.message : "Market scan failed.",
      },
      { status: 500 },
    );
  }
}
