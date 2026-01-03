import { writeBatch, collection, doc } from "firebase/firestore";

import {
  COUNTRIES_CONSTANTS,
  JOB_NAMES,
  WORLD_DOCUMENT_ID,
} from "@/lib/constants";
import { db } from "@/lib/firebase";
import { addDocuments, ensureRedisConnected } from "@/lib/redis";
import { exactKey, normalizeString } from "@/lib/utils";
import { registerJob } from "@/lib/job-registry";
import { CountryType } from "@/features/countries/types";

type StoreCountriesPayload = {
  countries: CountryType[];
  timestamp: number;
};

async function storeCountries(
  payload: StoreCountriesPayload
): Promise<boolean> {
  const { countries, timestamp } = payload;

  if (!countries || countries.length === 0) return true;

  const collectionRef = collection(db, COUNTRIES_CONSTANTS.COLLECTION_PATH);
  const batch = writeBatch(db);

  for (const country of countries) {
    const documentId = country.code ?? WORLD_DOCUMENT_ID;

    batch.set(doc(collectionRef, documentId), {
      ...country,
      updatedAt: timestamp,
    });
  }

  await batch.commit();

  await addDocuments(
    COUNTRIES_CONSTANTS.REDIS_PREFIX,
    countries.map((country) => ({
      ...country,
      code: country.code ?? WORLD_DOCUMENT_ID,
      name_exact: exactKey(country.name),
      name_search: normalizeString(country.name),
    })),
    "code"
  );

  const redisClient = await ensureRedisConnected();
  await redisClient.set(
    COUNTRIES_CONSTANTS.REDIS_INDEXED_KEY,
    timestamp.toString()
  );

  return true;
}

registerJob(JOB_NAMES.STORE_COUNTRIES, storeCountries);

export default storeCountries;
