import { writeBatch, collection, doc } from "firebase/firestore";

import { JOB_NAMES, TIMEZONES_CONSTANTS } from "@/lib/constants";
import { generateSafeDocumentId } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { addDocuments, ensureRedisConnected } from "@/lib/redis";
import { registerJob } from "@/lib/job-registry";
import { TimezoneType } from "@/features/timezones/types";

type StoreTimezonesPayload = {
  timezones: string[];
  timestamp: number;
};

async function storeTimezones(
  payload: StoreTimezonesPayload
): Promise<boolean> {
  const { timezones, timestamp } = payload;

  if (!timezones || timezones.length === 0) return true;

  const collectionRef = collection(db, TIMEZONES_CONSTANTS.COLLECTION_PATH);
  const batch = writeBatch(db);

  for (const timezone of timezones) {
    const documentId = generateSafeDocumentId(timezone);
    const docRef = doc(collectionRef, documentId);

    const createdData: TimezoneType = {
      name: timezone,
    };

    batch.set(docRef, createdData);
  }

  await batch.commit();

  await addDocuments(
    TIMEZONES_CONSTANTS.REDIS_PREFIX,
    timezones.map((timezone) => ({ name: timezone })),
    "name"
  );

  const redisClient = await ensureRedisConnected();
  await redisClient.set(
    TIMEZONES_CONSTANTS.REDIS_INDEXED_KEY,
    timestamp.toString()
  );

  return true;
}

registerJob(JOB_NAMES.STORE_TIMEZONES, storeTimezones);

export default storeTimezones;
