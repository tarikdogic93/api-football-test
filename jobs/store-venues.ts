import { writeBatch, collection, doc, arrayUnion } from "firebase/firestore";

import { JOB_NAMES, VENUES_CONSTANTS } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { addDocuments, ensureRedisConnected } from "@/lib/redis";
import { exactKey, getQueryIndexedKey, normalizeString } from "@/lib/utils";
import { registerJob } from "@/lib/job-registry";
import { VenueType } from "@/features/venues/types";

type StoreVenuesPayload = {
  venues: VenueType[];
  timestamp: number;
  querySignature: string;
  queriedValues: string[];
};

async function storeVenues(payload: StoreVenuesPayload): Promise<boolean> {
  const { venues, timestamp, querySignature, queriedValues } = payload;

  if (!venues || venues.length === 0) return true;

  const collectionRef = collection(db, VENUES_CONSTANTS.COLLECTION_PATH);
  const batch = writeBatch(db);

  const normalizedQueriedValues = queriedValues.map(normalizeString);

  for (const venue of venues) {
    const documentId = String(venue.id);
    const docRef = doc(collectionRef, documentId);

    batch.set(
      docRef,
      {
        ...venue,
        updatedAt: timestamp,
        nameNormalized: normalizeString(venue.name),
        queriedValues: arrayUnion(...normalizedQueriedValues),
      },
      { merge: true }
    );
  }

  await batch.commit();

  await addDocuments(
    VENUES_CONSTANTS.REDIS_PREFIX,
    venues.map((venue) => ({
      ...venue,
      id: String(venue.id),
      name_exact: exactKey(venue.name),
      city_exact: exactKey(venue.city),
      country_exact: exactKey(venue.country),
      name_search: normalizeString(venue.name),
      city_search: normalizeString(venue.city),
      country_search: normalizeString(venue.country),
    })),
    "id"
  );

  const redisClient = await ensureRedisConnected();
  const queryIndexedKey = getQueryIndexedKey(
    VENUES_CONSTANTS.REDIS_INDEXED_KEY,
    querySignature
  );
  await redisClient.set(queryIndexedKey, timestamp.toString());

  return true;
}

registerJob(JOB_NAMES.STORE_VENUES, storeVenues);

export default storeVenues;
