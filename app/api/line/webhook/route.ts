import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { removeLineWebhookUser, saveLineWebhookUser } from "@/lib/alerts/line-webhook-store";

type LineWebhookEvent = {
  type: string;
  source?: {
    type?: string;
    userId?: string;
  };
};

function isValidSignature(body: string, signature: string | null): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;

  const digest = crypto.createHmac("sha256", secret).update(body).digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!isValidSignature(body, signature)) {
    return NextResponse.json({ ok: false, reason: "Invalid LINE signature" }, { status: 401 });
  }

  const payload = JSON.parse(body) as { events?: LineWebhookEvent[] };
  const events = payload.events?.filter((event) => event.source?.userId) ?? [];
  const activeUsers = events.filter((event) => event.type !== "unfollow");
  const unfollowedUsers = events.filter((event) => event.type === "unfollow");

  await Promise.all(
    activeUsers.map((event) =>
      saveLineWebhookUser({
        userId: event.source?.userId ?? "",
        sourceType: event.source?.type ?? "unknown",
        eventType: event.type,
        receivedAt: new Date().toISOString(),
      }),
    ),
  );
  await Promise.all(
    unfollowedUsers.map((event) => removeLineWebhookUser(event.source?.userId ?? "")),
  );

  return NextResponse.json({
    ok: true,
    usersCaptured: activeUsers.length,
    usersRemoved: unfollowedUsers.length,
  });
}
