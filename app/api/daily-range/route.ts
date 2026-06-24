import { NextResponse } from "next/server";
import { buildDailyRange } from "@/lib/daily-range/daily-range-agent";

export async function GET() {
  const result = await buildDailyRange("EOSE");
  return NextResponse.json(result);
}
