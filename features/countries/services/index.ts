import {
  collection,
  doc,
  getDocs,
  query,
  limit,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { redis, ensureIndexOnce, addDocuments } from "@/lib/redis";
import { ONE_DAY } from "@/lib/constants";
import {
  CountryType,
  GetCountriesParams,
  CountriesAPIResponse,
} from "@/features/countries/types";

const COUNTRIES_COLLECTION = collection(db, "countries");
const WORLD_DOCUMENT_ID = "WORLD";
const REDIS_INDEX = "countries";
const REDIS_PREFIX = "countries:";

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
    indexName: REDIS_INDEX,
    prefix: REDIS_PREFIX,
    schema: [
      ["code", "TAG"],
      ["name", "TEXT"],
      ["name_exact", "TAG"],
      ["flag", "TEXT"],
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
        name_exact: country.name.toLowerCase(),
      })),
      "code"
    );
  }

  const filters: string[] = [];

  if (codeQuery) {
    filters.push(`@code:{${codeQuery}}`);
  }

  if (nameQuery) {
    filters.push(`@name_exact:{${nameQuery.toLowerCase()}}`);
  }

  if (searchQuery) {
    filters.push(`@name:*${searchQuery.toLowerCase()}*`);
  }

  const searchQueryString = filters.length > 0 ? filters.join(" ") : "*";

  const searchResult = (await redis.sendCommand([
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
  const hits: CountryType[] = [];

  for (let i = 1; i < searchResult.length; i += 2) {
    const fields = searchResult[i + 1] as string[];

    const nameIndex = fields.findIndex((f) => f === "$.name");
    const codeIndex = fields.findIndex((f) => f === "$.code");
    const flagIndex = fields.findIndex((f) => f === "$.flag");

    hits.push({
      name: fields[nameIndex + 1],
      code: fields[codeIndex + 1],
      flag: fields[flagIndex + 1],
    });
  }

  return {
    countries: hits,
    total,
    offset: offset + hits.length,
  };
}
