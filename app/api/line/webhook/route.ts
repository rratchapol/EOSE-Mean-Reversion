import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { removeLineWebhookUser, saveLineWebhookUser } from "@/lib/alerts/line-webhook-store";

type LineWebhookEvent = {
  type: string;
  replyToken?: string;
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

async function replyToLine(replyToken: string, text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;

  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
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

  const saveResults = await Promise.allSettled(
    activeUsers.map((event) =>
      saveLineWebhookUser({
        userId: event.source?.userId ?? "",
        sourceType: event.source?.type ?? "unknown",
        eventType: event.type,
        receivedAt: new Date().toISOString(),
      }),
    ),
  );
  await Promise.allSettled(
    unfollowedUsers.map((event) => removeLineWebhookUser(event.source?.userId ?? "")),
  );
  await Promise.allSettled(
    activeUsers
      .filter((event) => event.type === "message" && event.replyToken)
      .map((event) =>
        replyToLine(
          event.replyToken ?? "",
          [
            "ลงทะเบียนรับแจ้งเตือน EOSE แล้ว",
            "",
            `userId: ${event.source?.userId ?? "unknown"}`,
            "ถ้าเป็น bot/channel ใหม่ ให้เช็ค /api/line/users หลังจากนี้",
          ].join("\n"),
        ),
      ),
  );

  return NextResponse.json({
    ok: true,
    usersCaptured: activeUsers.length,
    usersRemoved: unfollowedUsers.length,
    saveFailures: saveResults.filter((result) => result.status === "rejected").length,
  });
}
