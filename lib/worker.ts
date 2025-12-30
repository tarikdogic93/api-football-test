import { Worker, Job } from "bullmq";

import { ensureIORedisConnected } from "@/lib/ioredis";
import { getBackgroundQueue } from "@/lib/queue";
import { getJobHandler } from "@/lib/job-registry";

async function startWorker() {
  const redisConnection = await ensureIORedisConnected();

  const backgroundWorker = new Worker(
    "backgroundQueue",
    async (job: Job) => {
      console.log(`Processing job ${job.id} (${job.name})`);

      const handler = getJobHandler(job.name);
      if (!handler) {
        throw new Error(`No handler registered for job: ${job.name}`);
      }

      return await handler(job.data);
    },
    { connection: redisConnection }
  );

  backgroundWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  backgroundWorker.on("failed", (job, error) => {
    if (job) console.error(`Job ${job.id} failed:`, error);
    else console.error("A job failed, but job is undefined:", error);
  });

  console.log("Generic BullMQ worker started and listening for jobs...");

  let shuttingDown = false;

  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log("Shutting down worker...");

    const timeout = setTimeout(() => {
      console.warn("Forced shutdown after timeout");
      process.exit(1);
    }, 30000);

    const queue = await getBackgroundQueue();

    const activeJobs = await queue.getActive();
    if (activeJobs.length > 0) {
      console.log(
        `Active jobs at shutdown: ${activeJobs.map((job) => job.id).join(", ")}`
      );
    } else {
      console.log("No active jobs at shutdown.");
    }

    await backgroundWorker.close();
    await redisConnection.quit();
    clearTimeout(timeout);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startWorker().catch((error) => {
  console.error("Worker failed to start:", error);
  process.exit(1);
});
