import { writeBatch, collection, doc } from "firebase/firestore";

import { JOB_NAMES, SEASONS_CONSTANTS } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { addDocuments, ensureRedisConnected } from "@/lib/redis";
import { registerJob } from "@/lib/job-registry";

type StoreSeasonsPayload = {
  seasons: number[];
  timestamp: number;
};

async function storeSeasons(payload: StoreSeasonsPayload): Promise<boolean> {
  const { seasons, timestamp } = payload;

  if (!seasons || seasons.length === 0) return true;

  const collectionRef = collection(db, SEASONS_CONSTANTS.COLLECTION_PATH);
  const batch = writeBatch(db);

  for (const season of seasons) {
    const documentId = String(season);
    const docRef = doc(collectionRef, documentId);

    batch.set(
      docRef,
      {
        year: season,
        updatedAt: timestamp,
      },
      { merge: true }
    );
  }

  await batch.commit();

  await addDocuments(
    SEASONS_CONSTANTS.REDIS_PREFIX,
    seasons.map((season) => ({ year: season })),
    "year"
  );

  const redisClient = await ensureRedisConnected();

  await redisClient.set(
    SEASONS_CONSTANTS.REDIS_INDEXED_KEY,
    timestamp.toString()
  );

  return true;
}

registerJob(JOB_NAMES.STORE_SEASONS, storeSeasons);

export default storeSeasons;
