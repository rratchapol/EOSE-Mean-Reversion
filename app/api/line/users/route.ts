import { NextResponse } from "next/server";
import { getLineWebhookUsers } from "@/lib/alerts/line-webhook-store";

export async function GET() {
  const users = await getLineWebhookUsers();
  return NextResponse.json({ users });
}
