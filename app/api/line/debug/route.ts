import { NextResponse } from "next/server";
import { getLineWebhookUsers } from "@/lib/alerts/line-webhook-store";
import { hasRedisEnv } from "@/lib/db/redis-store";

export async function GET() {
  const users = await getLineWebhookUsers();

  return NextResponse.json({
    hasChannelAccessToken: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN),
    hasChannelSecret: Boolean(process.env.LINE_CHANNEL_SECRET),
    hasFallbackUserId: Boolean(process.env.LINE_USER_ID),
    hasRedis: hasRedisEnv(),
    capturedUsers: users.length,
  });
}
