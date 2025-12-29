import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  writeBatch,
  getDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { ONE_DAY } from "@/lib/constants";
import { normalizeString } from "@/lib/utils";
import {
  ensureRedisConnected,
  ensureIndexOnce,
  addDocuments,
  parseRediSearchResults,
} from "@/lib/redis";
import { VenuesAPIResponse, VenueType } from "@/features/venues/types";

const VENUES_COLLECTION = collection(db, "venues");
const REDIS_INDEX = "venues";
const REDIS_PREFIX = "venues:";

let lastFetchedQuerySignature: string | null = null;

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
    nameQuery: params.nameQuery ?? null,
    cityQuery: params.cityQuery ?? null,
    countryQuery: params.countryQuery ?? null,
    searchQuery: params.searchQuery ?? null,
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
    indexName: REDIS_INDEX,
    prefix: REDIS_PREFIX,
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

  let shouldFetchAPI = lastFetchedQuerySignature !== currentQuerySignature;

  if (!shouldFetchAPI) {
    const snapshotCheck = await getDocs(query(VENUES_COLLECTION, limit(1)));
    if (snapshotCheck.empty) shouldFetchAPI = true;
  }

  if (!shouldFetchAPI && idQuery) {
    const venueDoc = await getDoc(doc(VENUES_COLLECTION, idQuery));
    if (!venueDoc.exists()) shouldFetchAPI = true;
    else {
      const data = venueDoc.data() as VenueType & { updatedAt?: number };
      if (!data.updatedAt || now - data.updatedAt > ONE_DAY)
        shouldFetchAPI = true;
    }
  }

  if (!shouldFetchAPI && nameQuery) {
    const lowerNameQuery = nameQuery.toLowerCase();
    const snapshot = await getDocs(
      query(
        VENUES_COLLECTION,
        where("nameLower", "==", lowerNameQuery),
        limit(1)
      )
    );
    if (
      snapshot.empty ||
      !snapshot.docs[0].data().updatedAt ||
      now - snapshot.docs[0].data().updatedAt > ONE_DAY
    ) {
      shouldFetchAPI = true;
    }
  }

  let fetchedVenues: VenueType[] = [];

  if (shouldFetchAPI) {
    fetchedVenues = await fetchVenuesFromAPI({
      idQuery,
      nameQuery,
      cityQuery,
      countryQuery,
      searchQuery,
    });

    if (fetchedVenues.length > 0) {
      const batch = writeBatch(db);
      for (const venue of fetchedVenues) {
        batch.set(doc(VENUES_COLLECTION, String(venue.id)), {
          ...venue,
          nameLower: venue.name?.toLowerCase() || null,
          updatedAt: now,
        });
      }
      await batch.commit();

      await addDocuments(
        REDIS_PREFIX,
        fetchedVenues.map((venue) => ({
          ...venue,
          id: String(venue.id),
          name_exact: normalizeString(venue.name),
          city_exact: normalizeString(venue.city),
          country_exact: normalizeString(venue.country),
          name_search: normalizeString(venue.name),
          city_search: normalizeString(venue.city),
          country_search: normalizeString(venue.country),
        })),
        "id"
      );

      lastFetchedQuerySignature = currentQuerySignature;
    }
  }

  const filters: string[] = [];

  if (idQuery) filters.push(`@id:{${idQuery.toLowerCase()}}`);
  if (nameQuery) filters.push(`@name_exact:{${normalizeString(nameQuery)}}`);
  if (cityQuery) filters.push(`@city_exact:{${normalizeString(cityQuery)}}`);
  if (countryQuery)
    filters.push(`@country_exact:{${normalizeString(countryQuery)}}`);

  if (searchQuery)
    filters.push(
      `(@name_search|city_search|country_search:*${normalizeString(
        searchQuery
      )}*)`
    );

  const searchQueryString = filters.length > 0 ? filters.join(" ") : "*";

  const searchResult = (await redisClient.sendCommand([
    "FT.SEARCH",
    REDIS_INDEX,
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

  return {
    venues: hits,
    total,
    offset: offset + hits.length,
  };
}
