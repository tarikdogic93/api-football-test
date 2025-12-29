import {
  collection,
  doc,
  getDocs,
  query,
  limit,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  ensureRedisConnected,
  ensureIndexOnce,
  addDocuments,
  parseRediSearchResults,
} from "@/lib/redis";
import { ONE_DAY } from "@/lib/constants";
import { normalizeString } from "@/lib/utils";
import { CountryType, CountriesAPIResponse } from "@/features/countries/types";

const COUNTRIES_COLLECTION = collection(db, "countries");
const WORLD_DOCUMENT_ID = "WORLD";
const REDIS_INDEX = "countries";
const REDIS_PREFIX = "countries:";

type CountriesQueryParams = {
  nameQuery?: string;
  codeQuery?: string;
  searchQuery?: string;
};

type CountriesParams = CountriesQueryParams & {
  pageSize: number;
  offset: number;
};

export async function fetchCountriesFromAPI(): Promise<CountryType[]> {
  const response = await fetch("https://v3.football.api-sports.io/countries", {
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY!,
    },
  });

  if (!response.ok) throw new Error(`API error ${response.status}`);
  const json = await response.json();
  return json.response as CountryType[];
}

export async function getCountries({
  pageSize,
  offset,
  nameQuery,
  codeQuery,
  searchQuery,
}: CountriesParams): Promise<CountriesAPIResponse> {
  const now = Date.now();

  const redisClient = await ensureRedisConnected();

  await ensureIndexOnce({
    indexName: REDIS_INDEX,
    prefix: REDIS_PREFIX,
    schema: [
      ["code", "TAG"],
      ["name_exact", "TAG"],
      ["name_search", "TEXT"],
    ],
  });

  const snapshotCheck = await getDocs(query(COUNTRIES_COLLECTION, limit(1)));
  let shouldFetchAPI = false;

  if (snapshotCheck.empty) {
    shouldFetchAPI = true;
  } else {
    const firstDoc = snapshotCheck.docs[0].data() as CountryType & {
      updatedAt?: number;
    };
    shouldFetchAPI = !firstDoc.updatedAt || now - firstDoc.updatedAt > ONE_DAY;
  }

  if (shouldFetchAPI) {
    const fetchedCountries = await fetchCountriesFromAPI();
    const batch = writeBatch(db);

    for (const country of fetchedCountries) {
      const documentId = country.code ?? WORLD_DOCUMENT_ID;
      batch.set(doc(COUNTRIES_COLLECTION, documentId), {
        ...country,
        updatedAt: now,
      });
    }
    await batch.commit();

    await addDocuments(
      REDIS_PREFIX,
      fetchedCountries.map((country) => ({
        ...country,
        code: country.code ?? WORLD_DOCUMENT_ID,
        name_exact: normalizeString(country.name),
        name_search: normalizeString(country.name),
      })),
      "code"
    );
  }

  const filters: string[] = [];

  if (codeQuery) {
    filters.push(`@code:{${codeQuery}}`);
  }

  if (nameQuery) {
    filters.push(`@name_exact:{${normalizeString(nameQuery)}}`);
  }

  if (searchQuery) {
    filters.push(`@name_search:*${normalizeString(searchQuery)}*`);
  }

  const searchQueryString = filters.length > 0 ? filters.join(" ") : "*";

  const searchResult = (await redisClient.sendCommand([
    "FT.SEARCH",
    REDIS_INDEX,
    searchQueryString,
    "LIMIT",
    offset.toString(),
    pageSize.toString(),
    "RETURN",
    "3",
    "$.name",
    "$.code",
    "$.flag",
    "DIALECT",
    "2",
  ])) as any[];

  const total = searchResult[0] as number;

  const rawHits = parseRediSearchResults<Record<string, string | null>>(
    searchResult,
    ["$.name", "$.code", "$.flag"]
  );

  const hits: CountryType[] = rawHits.map((hit) => ({
    name: hit["$.name"]!,
    code: hit["$.code"],
    flag: hit["$.flag"],
  }));

  return {
    countries: hits,
    total,
    offset: offset + hits.length,
  };
}
