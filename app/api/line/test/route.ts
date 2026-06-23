import { NextResponse } from "next/server";
import { sendLineText } from "@/lib/alerts/line";

export async function POST() {
  const result = await sendLineText(
    [
      "EOSE Scanner test",
      "",
      "LINE alert is connected.",
      "Real setup alerts will send only when scanner status is SETUP.",
    ].join("\n"),
  );

  return NextResponse.json(result);
}
