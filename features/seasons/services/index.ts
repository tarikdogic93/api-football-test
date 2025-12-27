import {
  collection,
  doc,
  getDocs,
  limit,
  writeBatch,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  redis,
  ensureIndexOnce,
  addDocuments,
  parseRediSearchResults,
} from "@/lib/redis";
import { ONE_DAY } from "@/lib/constants";
import {
  GetSeasonsParams,
  SeasonsAPIResponse,
  SeasonType,
} from "@/features/seasons/types";

const SEASONS_COLLECTION = collection(db, "seasons");
const REDIS_INDEX = "seasons";
const REDIS_PREFIX = "seasons:";

export async function fetchSeasonsFromAPI(): Promise<number[]> {
  const response = await fetch(
    "https://v3.football.api-sports.io/leagues/seasons",
    {
      headers: {
        "x-apisports-key": process.env.API_FOOTBALL_KEY!,
      },
    }
  );

  if (!response.ok) throw new Error(`API error ${response.status}`);
  const json = await response.json();
  return json.response as number[];
}

export async function getSeasons({
  pageSize,
  offset,
}: GetSeasonsParams): Promise<SeasonsAPIResponse> {
  const now = Date.now();

  await ensureIndexOnce({
    indexName: REDIS_INDEX,
    prefix: REDIS_PREFIX,
    schema: [["year", "NUMERIC", "SORTABLE"]],
  });

  const snapshotCheck = await getDocs(query(SEASONS_COLLECTION, limit(1)));
  let shouldFetchAPI = false;

  if (snapshotCheck.empty) {
    shouldFetchAPI = true;
  } else {
    const firstDoc = snapshotCheck.docs[0].data() as SeasonType & {
      updatedAt?: number;
    };

    shouldFetchAPI = !firstDoc.updatedAt || now - firstDoc.updatedAt > ONE_DAY;
  }

  if (shouldFetchAPI) {
    const fetchedSeasons = await fetchSeasonsFromAPI();
    const batch = writeBatch(db);

    for (const season of fetchedSeasons) {
      batch.set(doc(SEASONS_COLLECTION, String(season)), {
        year: season,
        updatedAt: now,
      });
    }

    await batch.commit();

    await addDocuments(
      REDIS_PREFIX,
      fetchedSeasons.map((season) => ({ year: season })),
      "year"
    );
  }

  const searchResult = (await redis.sendCommand([
    "FT.SEARCH",
    REDIS_INDEX,
    "*",
    "RETURN",
    "1",
    "$.year",
    "LIMIT",
    offset.toString(),
    pageSize.toString(),
  ])) as any[];

  const total = searchResult[0] as number;

  const rawHits = parseRediSearchResults<Record<string, string>>(searchResult, [
    "$.year",
  ]);

  const hits: SeasonType[] = rawHits.map((hit) => ({
    year: Number(hit["$.year"]),
  }));

  return {
    seasons: hits,
    total,
    offset: offset + hits.length,
  };
}
