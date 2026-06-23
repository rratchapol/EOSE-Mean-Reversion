import { NextResponse } from "next/server";
import { scanAndMaybeAlert } from "@/lib/workers/scan-and-alert";

export async function POST() {
  const result = await scanAndMaybeAlert("EOSE");
  return NextResponse.json(result);
}
