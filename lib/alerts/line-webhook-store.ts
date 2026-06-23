import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type LineWebhookUser = {
  userId: string;
  sourceType: string;
  eventType: string;
  receivedAt: string;
};

const dataDir = path.join(process.cwd(), "data");
const usersPath = path.join(dataDir, "line-users.json");

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
  const users = await readUsers();
  const withoutDuplicate = users.filter((item) => item.userId !== user.userId);
  await writeUsers([user, ...withoutDuplicate].slice(0, 20));
}

export async function getLineWebhookUsers(): Promise<LineWebhookUser[]> {
  return readUsers();
}
