import { writeBatch, collection, doc, getDoc } from "firebase/firestore";
import { JOB_NAMES, VENUES_CONSTANTS } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { addDocuments, ensureRedisConnected } from "@/lib/redis";
import { exactKey, getQueryIndexedKey, normalizeString } from "@/lib/utils";
import { registerJob } from "@/lib/job-registry";
import { ExtendedVenueType, VenueType } from "@/features/venues/types";

type StoreVenuesPayload = {
  venues: VenueType[];
  timestamp: number;
  querySignature: string;
  queryType: "city" | "country" | "search";
  queryValue: string;
};

async function storeVenues(payload: StoreVenuesPayload): Promise<boolean> {
  const { venues, timestamp, querySignature, queryType, queryValue } = payload;

  if (!venues || venues.length === 0) return true;

  const collectionRef = collection(db, VENUES_CONSTANTS.COLLECTION_PATH);
  const batch = writeBatch(db);

  for (const venue of venues) {
    const documentId = String(venue.id);
    const docRef = doc(collectionRef, documentId);

    let existingSearch: string[] = [];

    if (queryType === "search") {
      const docSnap = await getDoc(docRef);
      existingSearch = docSnap.exists()
        ? docSnap.data()?.queriedSearch ?? []
        : [];
    }

    const updatedData: ExtendedVenueType = {
      ...venue,
      updatedAt: timestamp,
      nameLower: normalizeString(venue.name),
    };

    if (queryType === "city") {
      updatedData.queriedCity = normalizeString(queryValue);
    }

    if (queryType === "country") {
      updatedData.queriedCountry = normalizeString(queryValue);
    }

    if (queryType === "search") {
      updatedData.queriedSearch = Array.from(
        new Set([...existingSearch, normalizeString(queryValue)])
      );
    }

    batch.set(docRef, updatedData, { merge: true });
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
