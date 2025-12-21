import {
  collection,
  doc,
  getDocs,
  writeBatch,
  limit,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { CountryType } from "@/features/countries/types";

const ONE_DAY = 24 * 60 * 60 * 1000;
const COUNTRIES_COLLECTION = collection(db, "countries");

const WORLD_DOCUMENT_ID = "WORLD";

export async function fetchCountriesFromAPI(): Promise<CountryType[]> {
  const response = await fetch("https://v3.football.api-sports.io/countries", {
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  const json = await response.json();
  return json.response as CountryType[];
}

export async function getCountriesMap(): Promise<
  Record<string, CountryType & { updatedAt: number }>
> {
  const now = Date.now();

  const freshnessQuery = query(COUNTRIES_COLLECTION, limit(1));
  const freshnessSnapshot = await getDocs(freshnessQuery);

  const firstDocument = freshnessSnapshot.docs[0];
  const isFresh =
    firstDocument !== undefined &&
    firstDocument.data().updatedAt !== undefined &&
    now - firstDocument.data().updatedAt < ONE_DAY;

  if (isFresh) {
    const allCountriesSnapshot = await getDocs(COUNTRIES_COLLECTION);

    return Object.fromEntries(
      allCountriesSnapshot.docs.map((documentSnapshot) => [
        documentSnapshot.id,
        documentSnapshot.data() as CountryType & { updatedAt: number },
      ])
    );
  }

  const fetchedCountries = await fetchCountriesFromAPI();

  const batch = writeBatch(db);
  const countriesMap: Record<string, CountryType & { updatedAt: number }> = {};

  for (const country of fetchedCountries) {
    const documentId =
      country.code !== null && country.code !== undefined
        ? country.code
        : WORLD_DOCUMENT_ID;

    const countryData: CountryType & { updatedAt: number } = {
      code:
        country.code !== null && country.code !== undefined
          ? country.code
          : null,
      name: country.name,
      flag:
        country.flag !== null && country.flag !== undefined
          ? country.flag
          : null,
      updatedAt: now,
    };

    const countryDocumentReference = doc(COUNTRIES_COLLECTION, documentId);
    batch.set(countryDocumentReference, countryData);

    countriesMap[documentId] = countryData;
  }

  await batch.commit();

  return countriesMap;
}
