import { NextResponse } from "next/server";
import { runBacktest } from "@/lib/backtest/backtest-engine";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const ticker = url.searchParams.get("ticker") ?? "EOSE";
    const range = url.searchParams.get("range") ?? "60d";
    const result = await runBacktest(ticker, range);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Backtest failed.",
      },
      { status: 400 },
    );
  }
}
