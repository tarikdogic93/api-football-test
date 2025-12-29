import { Queue } from "bullmq";
import { ensureIORedisConnected } from "@/lib/ioredis";

let backgroundQueueInstance: Queue | null = null;

export async function getBackgroundQueue(): Promise<Queue> {
  if (!backgroundQueueInstance) {
    const redisConnection = await ensureIORedisConnected();

    backgroundQueueInstance = new Queue("backgroundQueue", {
      connection: redisConnection,
    });
  }

  return backgroundQueueInstance;
}

export async function addBackgroundJob(
  jobName: string,
  jobData: Record<string, any>
) {
  const queue = await getBackgroundQueue();
  await queue.add(jobName, jobData);
}
