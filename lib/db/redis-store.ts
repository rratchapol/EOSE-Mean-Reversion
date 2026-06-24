export function hasRedisEnv(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function redisCommand<T>(command: unknown[]): Promise<T> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Upstash Redis env is missing.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash Redis request failed: ${response.status}`);
  }

  const body = (await response.json()) as { result: T; error?: string };
  if (body.error) {
    throw new Error(body.error);
  }

  return body.result;
}

export async function redisLrange<T>(key: string, start: number, stop: number): Promise<T[]> {
  const values = await redisCommand<string[]>(["LRANGE", key, start, stop]);
  return values.map((value) => JSON.parse(value) as T);
}

export async function redisLpushTrim<T>(key: string, value: T, maxItems: number): Promise<void> {
  await redisCommand(["LPUSH", key, JSON.stringify(value)]);
  await redisCommand(["LTRIM", key, 0, maxItems - 1]);
}

export async function redisHset<T>(key: string, field: string, value: T): Promise<void> {
  await redisCommand(["HSET", key, field, JSON.stringify(value)]);
}

export async function redisHdel(key: string, field: string): Promise<void> {
  await redisCommand(["HDEL", key, field]);
}

export async function redisHvals<T>(key: string): Promise<T[]> {
  const values = await redisCommand<string[]>(["HVALS", key]);
  return values.map((value) => JSON.parse(value) as T);
}
