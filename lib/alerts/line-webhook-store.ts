import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hasRedisEnv, redisHdel, redisHset, redisHvals } from "@/lib/db/redis-store";

export type LineWebhookUser = {
  userId: string;
  sourceType: string;
  eventType: string;
  receivedAt: string;
};

const dataDir = path.join(process.cwd(), "data");
const usersPath = path.join(dataDir, "line-users.json");
const usersKey = "eose:line-users";

async function readUsers(): Promise<LineWebhookUser[]> {
  try {
    return JSON.parse(await readFile(usersPath, "utf8")) as LineWebhookUser[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeUsers(users: LineWebhookUser[]): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(usersPath, JSON.stringify(users, null, 2), "utf8");
}

export async function saveLineWebhookUser(user: LineWebhookUser): Promise<void> {
  if (hasRedisEnv()) {
    await redisHset(usersKey, user.userId, user);
    return;
  }

  const users = await readUsers();
  const withoutDuplicate = users.filter((item) => item.userId !== user.userId);
  await writeUsers([user, ...withoutDuplicate].slice(0, 500));
}

export async function getLineWebhookUsers(): Promise<LineWebhookUser[]> {
  if (hasRedisEnv()) {
    return redisHvals<LineWebhookUser>(usersKey);
  }

  return readUsers();
}

export async function removeLineWebhookUser(userId: string): Promise<void> {
  if (hasRedisEnv()) {
    await redisHdel(usersKey, userId);
    return;
  }

  const users = await readUsers();
  await writeUsers(users.filter((user) => user.userId !== userId));
}
