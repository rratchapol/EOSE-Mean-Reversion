import { NextResponse } from "next/server";
import { sendLineText } from "@/lib/alerts/line";
import { analyzeDailyRangeWithGoogleAi } from "@/lib/ai/google-ai-agent";
import { isCronAuthorized } from "@/lib/cron/auth";
import { buildDailyRange, buildDailyRangeLineMessage } from "@/lib/daily-range/daily-range-agent";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, reason: "Unauthorized" }, { status: 401 });
  }

  const range = await buildDailyRange("EOSE");
  const aiAnalysis = await analyzeDailyRangeWithGoogleAi(range);
  const alert = await sendLineText(buildDailyRangeLineMessage(range, aiAnalysis));

  return NextResponse.json({ ok: alert.sent, alert, range, aiAnalysis });
}
