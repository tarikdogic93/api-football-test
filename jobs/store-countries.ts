import { writeBatch, collection, doc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { addDocuments, ensureRedisConnected } from "@/lib/redis";
import { normalizeString } from "@/lib/utils";
import { registerJob } from "@/lib/job-registry";
import { CountryType } from "@/features/countries/types";

const WORLD_DOCUMENT_ID = "WORLD";

type StoreCountriesPayload = {
  countries: CountryType[];
  timestamp: number | string;
  collectionPath: string;
  redisPrefix: string;
};

async function storeCountries(
  payload: StoreCountriesPayload
): Promise<boolean> {
  const { countries, timestamp, collectionPath, redisPrefix } = payload;

  if (!countries || countries.length === 0) return true;

  const collectionRef = collection(db, collectionPath);
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
    redisPrefix,
    countries.map((country) => ({
      ...country,
      code: country.code ?? WORLD_DOCUMENT_ID,
      name_exact: normalizeString(country.name),
      name_search: normalizeString(country.name),
    })),
    "code"
  );

  const redisClient = await ensureRedisConnected();
  await redisClient.set(`${collectionPath}:indexed`, timestamp.toString());

  return true;
}

registerJob("storeCountries", storeCountries);

export default storeCountries;
