import {
  collection,
  doc,
  getDocs,
  query,
  limit,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { meiliClient, ensureIndexOnce } from "@/lib/meilisearch";
import { ONE_DAY } from "@/lib/constants";
import {
  CountryType,
  GetCountriesParams,
  CountriesAPIResponse,
} from "@/features/countries/types";

const COUNTRIES_COLLECTION = collection(db, "countries");
const WORLD_DOCUMENT_ID = "WORLD";
const MEILI_INDEX = meiliClient.index("countries");

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
}: GetCountriesParams): Promise<CountriesAPIResponse> {
  const now = Date.now();

  await ensureIndexOnce({
    indexName: "countries",
    primaryKey: "code",
    searchableAttributes: ["name"],
    filterableAttributes: ["code", "name"],
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

    const task = await MEILI_INDEX.addDocuments(
      fetchedCountries.map((country) => ({
        ...country,
        code: country.code ?? WORLD_DOCUMENT_ID,
      }))
    );
    await meiliClient.tasks.waitForTask(task.taskUid);
  }

  const filters: string[] = [];

  if (nameQuery) filters.push(`name = "${nameQuery}"`);
  if (codeQuery) filters.push(`code = "${codeQuery}"`);

  let result;
  if (searchQuery) {
    filters.push(`name CONTAINS "${searchQuery}"`);
    result = await MEILI_INDEX.search<CountryType>("", {
      limit: pageSize,
      offset,
      filter: filters.length > 0 ? filters.join(" AND ") : undefined,
    });
  } else {
    result = await MEILI_INDEX.search<CountryType>("", {
      limit: pageSize,
      offset,
      filter: filters.length > 0 ? filters.join(" AND ") : undefined,
    });
  }

  return {
    countries: result.hits,
    total: result.estimatedTotalHits ?? result.hits.length,
    offset: offset + result.hits.length,
  };
}
