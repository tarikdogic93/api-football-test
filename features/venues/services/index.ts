import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  getDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { JOB_NAMES, ONE_DAY, VENUES_CONSTANTS } from "@/lib/constants";
import { exactKey, getQueryIndexedKey, normalizeString } from "@/lib/utils";
import {
  ensureRedisConnected,
  ensureIndexOnce,
  parseRediSearchResults,
} from "@/lib/redis";
import { addBackgroundJob } from "@/lib/queue";
import { VenuesAPIResponse, VenueType } from "@/features/venues/types";

const VENUES_COLLECTION = collection(db, VENUES_CONSTANTS.COLLECTION_PATH);

let fetchedVenuesCache: Record<string, VenueType[]> = {};
let lastFetchedQuerySignatures: Record<string, number> = {};

type VenuesQueryParams = {
  idQuery?: string;
  nameQuery?: string;
  cityQuery?: string;
  countryQuery?: string;
  searchQuery?: string;
};

type VenuesParams = VenuesQueryParams & {
  pageSize: number;
  offset: number;
};

function buildVenuesQuerySignature(params: VenuesQueryParams) {
  return JSON.stringify({
    idQuery: params.idQuery ?? null,
    nameQuery: params.nameQuery ? normalizeString(params.nameQuery) : null,
    cityQuery: params.cityQuery ? normalizeString(params.cityQuery) : null,
    countryQuery: params.countryQuery
      ? normalizeString(params.countryQuery)
      : null,
    searchQuery: params.searchQuery
      ? normalizeString(params.searchQuery)
      : null,
  });
}

export async function fetchVenuesFromAPI(query: VenuesQueryParams) {
  const params = new URLSearchParams();
  if (query.idQuery) params.set("id", query.idQuery);
  if (query.nameQuery) params.set("name", query.nameQuery);
  if (query.cityQuery) params.set("city", query.cityQuery);
  if (query.countryQuery) params.set("country", query.countryQuery);
  if (query.searchQuery) params.set("search", query.searchQuery);

  const response = await fetch(
    `https://v3.football.api-sports.io/venues?${params.toString()}`,
    { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! } }
  );

  if (!response.ok) throw new Error(`API error ${response.status}`);

  const json = await response.json();
  return json.response as VenueType[];
}

export async function getVenues({
  pageSize,
  offset,
  idQuery,
  nameQuery,
  cityQuery,
  countryQuery,
  searchQuery,
}: VenuesParams): Promise<VenuesAPIResponse> {
  const now = Date.now();

  const redisClient = await ensureRedisConnected();

  await ensureIndexOnce({
    indexName: VENUES_CONSTANTS.REDIS_INDEX,
    prefix: VENUES_CONSTANTS.REDIS_PREFIX,
    schema: [
      ["id", "TAG"],
      ["name_exact", "TAG"],
      ["name_search", "TEXT"],
      ["city_exact", "TAG"],
      ["city_search", "TEXT"],
      ["country_exact", "TAG"],
      ["country_search", "TEXT"],
    ],
  });

  const currentQuerySignature = buildVenuesQuerySignature({
    idQuery,
    nameQuery,
    cityQuery,
    countryQuery,
    searchQuery,
  });

  const isSameQueryAsLastTime =
    !!lastFetchedQuerySignatures[currentQuerySignature];

  const normalizedQueryValues = [cityQuery, countryQuery, searchQuery]
    .filter(Boolean)
    .map(normalizeString);

  let isStale = false;

  if (!isSameQueryAsLastTime) {
    if (idQuery) {
      const docSnap = await getDoc(doc(VENUES_COLLECTION, idQuery));
      isStale =
        !docSnap.exists() ||
        !docSnap.data()?.updatedAt ||
        now - docSnap.data().updatedAt > ONE_DAY;
    } else if (nameQuery) {
      const snapshot = await getDocs(
        query(
          VENUES_COLLECTION,
          where("nameNormalized", "==", normalizeString(nameQuery)),
          limit(1)
        )
      );
      isStale =
        snapshot.empty ||
        !snapshot.docs[0].data()?.updatedAt ||
        now - snapshot.docs[0].data().updatedAt > ONE_DAY;
    } else if (cityQuery || countryQuery || searchQuery) {
      const snapshotPromises = normalizedQueryValues.map((value) =>
        getDocs(
          query(
            VENUES_COLLECTION,
            where("queriedValues", "array-contains", value),
            limit(1)
          )
        )
      );

      const snapshots = await Promise.all(snapshotPromises);
      isStale = snapshots.every(
        (snap) =>
          snap.empty ||
          !snap.docs[0]?.data()?.updatedAt ||
          now - snap.docs[0].data().updatedAt > ONE_DAY
      );
    }
  }

  const shouldFetchAPI = !isSameQueryAsLastTime && isStale;

  if (shouldFetchAPI) {
    const lockKey = `${VENUES_CONSTANTS.REDIS_LOCK_KEY}:${currentQuerySignature}`;
    const lockAcquired = await redisClient.set(lockKey, "1", {
      NX: true,
      EX: 10,
    });

    if (lockAcquired) {
      try {
        fetchedVenuesCache[currentQuerySignature] = await fetchVenuesFromAPI({
          idQuery,
          nameQuery,
          cityQuery,
          countryQuery,
          searchQuery,
        });

        if (fetchedVenuesCache[currentQuerySignature].length > 0) {
          await addBackgroundJob(JOB_NAMES.STORE_VENUES, {
            venues: fetchedVenuesCache[currentQuerySignature],
            timestamp: now,
            querySignature: currentQuerySignature,
            queryValues: normalizedQueryValues,
          });

          lastFetchedQuerySignatures[currentQuerySignature] = now;
        }
      } finally {
        await redisClient.del(lockKey);
      }
    }
  }

  const queryIndexedKey = getQueryIndexedKey(
    VENUES_CONSTANTS.REDIS_INDEXED_KEY,
    currentQuerySignature
  );
  const indexedAtStr = await redisClient.get(queryIndexedKey);
  const indexedAt = indexedAtStr ? Number(indexedAtStr) : 0;
  const isIndexedFresh = now - indexedAt <= ONE_DAY;

  if (!isIndexedFresh && fetchedVenuesCache[currentQuerySignature]) {
    const cachedVenues = fetchedVenuesCache[currentQuerySignature] ?? [];
    const paginatedVenues = cachedVenues.slice(offset, offset + pageSize);

    return {
      venues: paginatedVenues,
      total: cachedVenues.length,
      offset: offset + paginatedVenues.length,
    };
  }

  const filters: string[] = [];

  if (idQuery) filters.push(`@id:{${idQuery}}`);
  if (nameQuery) filters.push(`@name_exact:{${exactKey(nameQuery)}}`);
  if (cityQuery) filters.push(`@city_exact:{${exactKey(cityQuery)}}`);
  if (countryQuery) filters.push(`@country_exact:{${exactKey(countryQuery)}}`);
  if (searchQuery)
    filters.push(
      `(@name_search|city_search|country_search:*${normalizeString(
        searchQuery
      )}*)`
    );

  const searchQueryString = filters.length > 0 ? filters.join(" ") : "*";

  const searchResult = (await redisClient.sendCommand([
    "FT.SEARCH",
    VENUES_CONSTANTS.REDIS_INDEX,
    searchQueryString,
    "LIMIT",
    offset.toString(),
    pageSize.toString(),
    "RETURN",
    "10",
    "$.id",
    "$.name",
    "$.city",
    "$.country",
    "$.address",
    "$.capacity",
    "$.surface",
    "$.image",
    "DIALECT",
    "2",
  ])) as any[];

  const total = searchResult[0] as number;

  const rawHits = parseRediSearchResults<Record<string, string | null>>(
    searchResult,
    [
      "$.id",
      "$.name",
      "$.city",
      "$.country",
      "$.address",
      "$.capacity",
      "$.surface",
      "$.image",
    ]
  );

  const hits: VenueType[] = rawHits.map((hit) => ({
    id: Number(hit["$.id"]),
    name: hit["$.name"]!,
    city: hit["$.city"],
    country: hit["$.country"],
    address: hit["$.address"],
    capacity: hit["$.capacity"] !== null ? Number(hit["$.capacity"]) : null,
    surface: hit["$.surface"],
    image: hit["$.image"],
  }));

  delete fetchedVenuesCache[currentQuerySignature];

  return {
    venues: hits,
    total,
    offset: offset + hits.length,
  };
}
