import IORedis from "ioredis";
import { Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("Missing REDIS_URL environment variable");
}

export const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const backgroundQueue = new Queue("backgroundQueue", {
  connection,
});

export async function addBackgroundJob(
  name: string,
  data: Record<string, any>
) {
  await backgroundQueue.add(name, data);
}
