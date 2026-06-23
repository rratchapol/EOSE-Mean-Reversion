import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const usersPath = path.join(process.cwd(), "data", "line-users.json");
const envPath = path.join(process.cwd(), ".env.local");

const users = JSON.parse(await readFile(usersPath, "utf8"));
const userId = users?.[0]?.userId;

if (!userId) {
  console.error("No LINE userId found. Add the bot and send it a message first.");
  process.exit(1);
}

let env = await readFile(envPath, "utf8");
if (env.includes("LINE_USER_ID=")) {
  env = env.replace(/^LINE_USER_ID=.*$/m, `LINE_USER_ID=${userId}`);
} else {
  env = `${env.trimEnd()}\nLINE_USER_ID=${userId}\n`;
}

await writeFile(envPath, env, "utf8");
console.log(`Saved LINE_USER_ID=${userId}`);
