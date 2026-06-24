import { NextResponse } from "next/server";
import { sendLineText } from "@/lib/alerts/line";
import { isCronAuthorized } from "@/lib/cron/auth";
import { buildDailyRange, buildDailyRangeLineMessage } from "@/lib/daily-range/daily-range-agent";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, reason: "Unauthorized" }, { status: 401 });
  }

  const range = await buildDailyRange("EOSE");
  const alert = await sendLineText(buildDailyRangeLineMessage(range));

  return NextResponse.json({ ok: alert.sent, alert, range });
}
