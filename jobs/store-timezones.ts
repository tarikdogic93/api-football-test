import { writeBatch, collection, doc } from "firebase/firestore";

import { generateSafeDocumentId } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { addDocuments, ensureRedisConnected } from "@/lib/redis";
import { registerJob } from "@/lib/job-registry";

type StoreTimezonesPayload = {
  timezones: string[];
  timestamp: number | string;
  collectionPath: string;
  redisPrefix: string;
};

async function storeTimezones(
  payload: StoreTimezonesPayload
): Promise<boolean> {
  const { timezones, timestamp, collectionPath, redisPrefix } = payload;

  if (!timezones || timezones.length === 0) return true;

  const collectionRef = collection(db, collectionPath);
  const batch = writeBatch(db);

  for (const timezone of timezones) {
    const documentId = generateSafeDocumentId(timezone);
    batch.set(doc(collectionRef, documentId), {
      name: timezone,
      updatedAt: timestamp,
    });
  }

  await batch.commit();

  await addDocuments(
    redisPrefix,
    timezones.map((timezone) => ({ name: timezone })),
    "name"
  );

  const redisClient = await ensureRedisConnected();
  await redisClient.set("timezones:indexed", timestamp.toString());

  return true;
}

registerJob("storeTimezones", storeTimezones);

export default storeTimezones;
