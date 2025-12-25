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
import { meiliClient, ensureIndexOnce } from "@/lib/meilisearch";
import { ONE_DAY } from "@/lib/constants";
import {
  GetVenuesParams,
  VenuesAPIResponse,
  VenueType,
} from "@/features/venues/types";

const VENUES_COLLECTION = collection(db, "venues");
const MEILI_INDEX = meiliClient.index("venues");

let lastFetchedQuerySignature: string | null = null;

function buildVenuesQuerySignature(params: {
  idQuery?: string;
  nameQuery?: string;
  cityQuery?: string;
  countryQuery?: string;
  searchQuery?: string;
}) {
  return JSON.stringify({
    idQuery: params.idQuery ?? null,
    nameQuery: params.nameQuery ?? null,
    cityQuery: params.cityQuery ?? null,
    countryQuery: params.countryQuery ?? null,
    searchQuery: params.searchQuery ?? null,
  });
}

export async function fetchVenuesFromAPI(query: {
  idQuery?: string;
  nameQuery?: string;
  cityQuery?: string;
  countryQuery?: string;
  searchQuery?: string;
}) {
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
}: GetVenuesParams): Promise<VenuesAPIResponse> {
  const now = Date.now();

  await ensureIndexOnce({
    indexName: "venues",
    primaryKey: "id",
    searchableAttributes: ["name", "city", "country"],
    filterableAttributes: ["id", "name", "city", "country"],
  });

  const currentQuerySignature = buildVenuesQuerySignature({
    idQuery,
    nameQuery,
    cityQuery,
    countryQuery,
    searchQuery,
  });

  let shouldFetchAPI = lastFetchedQuerySignature !== currentQuerySignature;

  if (!shouldFetchAPI && idQuery) {
    const venueDoc = await getDoc(doc(VENUES_COLLECTION, String(idQuery)));
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

  if (!shouldFetchAPI) {
    const snapshotCheck = await getDocs(query(VENUES_COLLECTION, limit(1)));
    if (snapshotCheck.empty) shouldFetchAPI = true;
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

      const task = await MEILI_INDEX.addDocuments(fetchedVenues);
      await meiliClient.tasks.waitForTask(task.taskUid);

      lastFetchedQuerySignature = currentQuerySignature;
    }
  }

  const filters: string[] = [];
  if (idQuery) filters.push(`id = ${idQuery}`);
  if (nameQuery) filters.push(`name = "${nameQuery}"`);
  if (cityQuery) filters.push(`city = "${cityQuery}"`);
  if (countryQuery) filters.push(`country = "${countryQuery}"`);

  const result = await MEILI_INDEX.search<VenueType>(searchQuery || "", {
    limit: pageSize,
    offset,
    filter: filters.length > 0 ? filters.join(" AND ") : undefined,
  });

  return {
    venues: result.hits,
    total: result.estimatedTotalHits ?? result.hits.length,
    offset: offset + result.hits.length,
  };
}
