import { NextResponse } from "next/server";
import { runScanner } from "@/lib/signals/signal-engine";

export async function GET() {
  const scan = await runScanner("EOSE");
  return NextResponse.json(scan);
}
