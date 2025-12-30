import { collection, getDocs, query, limit } from "firebase/firestore";

import { ONE_DAY } from "@/lib/constants";
import { db } from "@/lib/firebase";
import {
  ensureRedisConnected,
  ensureIndexOnce,
  parseRediSearchResults,
} from "@/lib/redis";
import { normalizeString } from "@/lib/utils";
import { addBackgroundJob } from "@/lib/queue";
import { CountryType, CountriesAPIResponse } from "@/features/countries/types";

type CountriesQueryParams = {
  nameQuery?: string;
  codeQuery?: string;
  searchQuery?: string;
};

type CountriesParams = CountriesQueryParams & {
  pageSize: number;
  offset: number;
};

const collectionPath = "countries";
const REDIS_INDEX = collectionPath;
const REDIS_PREFIX = `${collectionPath}:`;
const COUNTRIES_COLLECTION = collection(db, collectionPath);

let fetchedCountriesCache: CountryType[] | null = null;

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

  const lockKey = "countries:fetch-lock";

  if (shouldFetchAPI) {
    const lockAcquired = await redisClient.set(lockKey, "1", {
      NX: true,
      EX: 10,
    });

    if (lockAcquired) {
      try {
        fetchedCountriesCache = await fetchCountriesFromAPI();

        await addBackgroundJob("storeCountries", {
          countries: fetchedCountriesCache,
          timestamp: now,
          collectionPath,
          redisPrefix: REDIS_PREFIX,
        });
      } finally {
        await redisClient.del(lockKey);
      }
    }
  }

  const indexedAtStr = await redisClient.get(`${collectionPath}:indexed`);
  const indexedAt = indexedAtStr ? Number(indexedAtStr) : 0;
  const isIndexedFresh = now - indexedAt <= ONE_DAY;

  if (!isIndexedFresh && fetchedCountriesCache) {
    const filteredCountries = fetchedCountriesCache.filter((country) => {
      if (codeQuery && country.code?.toLowerCase() !== codeQuery.toLowerCase())
        return false;
      if (
        nameQuery &&
        normalizeString(country.name) !== normalizeString(nameQuery)
      )
        return false;
      if (
        searchQuery &&
        !normalizeString(country.name).includes(normalizeString(searchQuery))
      )
        return false;
      return true;
    });

    const paginatedCountries = filteredCountries.slice(
      offset,
      offset + pageSize
    );

    return {
      countries: paginatedCountries,
      total: filteredCountries.length,
      offset: offset + paginatedCountries.length,
    };
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

  if (fetchedCountriesCache) fetchedCountriesCache = null;

  return {
    countries: hits,
    total,
    offset: offset + hits.length,
  };
}
