import { NextResponse } from "next/server";
import { getLineWebhookUsers, removeLineWebhookUser } from "@/lib/alerts/line-webhook-store";
import { isCronAuthorized } from "@/lib/cron/auth";

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, reason: "Unauthorized" }, { status: 401 });
  }

  const users = await getLineWebhookUsers();
  await Promise.all(users.map((user) => removeLineWebhookUser(user.userId)));

  return NextResponse.json({ ok: true, removed: users.length });
}
