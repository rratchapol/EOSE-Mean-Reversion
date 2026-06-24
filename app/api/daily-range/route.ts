import { NextResponse } from "next/server";
import { analyzeDailyRangeWithGoogleAi } from "@/lib/ai/google-ai-agent";
import { buildDailyRange } from "@/lib/daily-range/daily-range-agent";

export async function GET() {
  const result = await buildDailyRange("EOSE");
  const aiAnalysis = await analyzeDailyRangeWithGoogleAi(result);
  return NextResponse.json({ ...result, aiAnalysis });
}
