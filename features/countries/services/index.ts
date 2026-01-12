import { collection, getDocs, query, limit } from "firebase/firestore";

import { COUNTRIES_CONSTANTS, JOB_NAMES, ONE_DAY } from "@/lib/constants";
import { db } from "@/lib/firebase";
import {
  ensureRedisConnected,
  ensureIndexOnce,
  parseRediSearchResults,
} from "@/lib/redis";
import { exactKey, normalizeString } from "@/lib/utils";
import { addBackgroundJob } from "@/lib/queue";
import { fetchFromAPIFootball } from "@/lib/api-football";
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

const COUNTRIES_COLLECTION = collection(
  db,
  COUNTRIES_CONSTANTS.COLLECTION_PATH
);

let fetchedCountriesCache: CountryType[] | null = null;

export function fetchCountriesFromAPI(): Promise<CountryType[]> {
  return fetchFromAPIFootball<CountryType[]>({
    endpoint: COUNTRIES_CONSTANTS.API_ENDPOINT,
  });
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
    indexName: COUNTRIES_CONSTANTS.REDIS_INDEX,
    prefix: COUNTRIES_CONSTANTS.REDIS_PREFIX,
    schema: [
      ["code_exact", "TAG"],
      ["name_exact", "TAG"],
      ["name_search", "TEXT"],
    ],
  });

  const snapshot = await getDocs(query(COUNTRIES_COLLECTION, limit(1)));
  const isStale =
    snapshot.empty ||
    !snapshot.docs[0].data()?.updatedAt ||
    now - snapshot.docs[0].data().updatedAt > ONE_DAY;

  if (isStale) {
    const lockAcquired = await redisClient.set(
      COUNTRIES_CONSTANTS.REDIS_LOCK_KEY,
      "1",
      {
        NX: true,
        EX: 10,
      }
    );

    if (lockAcquired) {
      try {
        fetchedCountriesCache = await fetchCountriesFromAPI();

        await addBackgroundJob(JOB_NAMES.STORE_COUNTRIES, {
          countries: fetchedCountriesCache,
          timestamp: now,
        });
      } finally {
        await redisClient.del(COUNTRIES_CONSTANTS.REDIS_LOCK_KEY);
      }
    }
  }

  const indexedAtStr = await redisClient.get(
    COUNTRIES_CONSTANTS.REDIS_INDEXED_KEY
  );
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
    filters.push(`@code_exact:{${exactKey(codeQuery)}}`);
  }

  if (nameQuery) {
    filters.push(`@name_exact:{${exactKey(nameQuery)}}`);
  }

  if (searchQuery) {
    filters.push(`@name_search:*${normalizeString(searchQuery)}*`);
  }

  const searchQueryString = filters.length > 0 ? filters.join(" ") : "*";

  const searchResult = (await redisClient.sendCommand([
    "FT.SEARCH",
    COUNTRIES_CONSTANTS.REDIS_INDEX,
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
