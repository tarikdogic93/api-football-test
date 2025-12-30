import { writeBatch, collection, doc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { addDocuments, ensureRedisConnected } from "@/lib/redis";
import { registerJob } from "@/lib/job-registry";

type StoreSeasonsPayload = {
  seasons: number[];
  timestamp: number | string;
  collectionPath: string;
  redisPrefix: string;
};

async function storeSeasons(payload: StoreSeasonsPayload): Promise<boolean> {
  const { seasons, timestamp, collectionPath, redisPrefix } = payload;

  if (!seasons || seasons.length === 0) return true;

  const collectionRef = collection(db, collectionPath);
  const batch = writeBatch(db);
  for (const season of seasons) {
    batch.set(doc(collectionRef, String(season)), {
      year: season,
      updatedAt: timestamp,
    });
  }
  await batch.commit();

  await addDocuments(
    redisPrefix,
    seasons.map((season) => ({ year: season })),
    "year"
  );

  const redisClient = await ensureRedisConnected();

  await redisClient.set(`${collectionPath}:indexed`, timestamp.toString());

  return true;
}

registerJob("storeSeasons", storeSeasons);

export default storeSeasons;
