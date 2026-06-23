import { NextResponse } from "next/server";
import { getSignalHistory } from "@/lib/db/history-store";

export async function GET() {
  const history = await getSignalHistory();
  return NextResponse.json({ history });
}
