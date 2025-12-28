import IORedis from "ioredis";
import { Worker } from "bullmq";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("Missing REDIS_URL environment variable");
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "backgroundQueue",
  async (job) => {
    console.log(`Processing job ${job.id}`);

    const { handlerPath, payload } = job.data;
    if (!handlerPath) throw new Error("Missing handlerPath in job data");

    const handlerModule = await import(handlerPath);
    if (typeof handlerModule.default !== "function")
      throw new Error(
        `Handler at ${handlerPath} does not export a default function`
      );

    return await handlerModule.default(payload);
  },
  { connection }
);

worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) => {
  if (job) {
    console.error(`Job ${job.id} failed:`, err);
  } else {
    console.error("A job failed, but job is undefined:", err);
  }
});

console.log("Generic BullMQ worker started and listening for jobs...");
