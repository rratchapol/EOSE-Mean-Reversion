import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { saveLineWebhookUser } from "@/lib/alerts/line-webhook-store";

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
  const users = payload.events?.filter((event) => event.source?.userId) ?? [];

  await Promise.all(
    users.map((event) =>
      saveLineWebhookUser({
        userId: event.source?.userId ?? "",
        sourceType: event.source?.type ?? "unknown",
        eventType: event.type,
        receivedAt: new Date().toISOString(),
      }),
    ),
  );

  return NextResponse.json({ ok: true, usersCaptured: users.length });
}
