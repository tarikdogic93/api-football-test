import IORedis from "ioredis";

let ioredisConnection: IORedis | null = null;

export function getIORedisConnection(): IORedis {
  if (!ioredisConnection) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error("Missing REDIS_URL environment variable");
    }

    ioredisConnection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

    ioredisConnection.on("error", (error) => {
      console.error("IORedis Client Error:", error);
    });
  }

  return ioredisConnection;
}

export async function ensureIORedisConnected(): Promise<IORedis> {
  const redisConnection = getIORedisConnection();
  return redisConnection;
}
