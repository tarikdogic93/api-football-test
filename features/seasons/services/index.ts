import { collection, getDocs, limit, query } from "firebase/firestore";

import { ONE_DAY } from "@/lib/constants";
import { db } from "@/lib/firebase";
import {
  ensureRedisConnected,
  ensureIndexOnce,
  parseRediSearchResults,
} from "@/lib/redis";
import { addBackgroundJob } from "@/lib/queue";
import {
  GetSeasonsParams,
  SeasonsAPIResponse,
  SeasonType,
} from "@/features/seasons/types";

const SEASONS_COLLECTION = collection(db, "seasons");
const REDIS_INDEX = "seasons";
const REDIS_PREFIX = "seasons:";

let fetchedSeasonsCache: number[] | null = null;

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

  const redisClient = await ensureRedisConnected();

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

  const lockKey = "seasons:fetch-lock";

  if (shouldFetchAPI && !fetchedSeasonsCache) {
    const lockAcquired = await redisClient.set(lockKey, "1", {
      NX: true,
      EX: 10,
    });

    if (lockAcquired) {
      try {
        fetchedSeasonsCache = await fetchSeasonsFromAPI();

        await addBackgroundJob("storeSeasons", {
          seasons: fetchedSeasonsCache,
          timestamp: Date.now(),
          collectionPath: "seasons",
          redisPrefix: REDIS_PREFIX,
        });
      } finally {
        await redisClient.del(lockKey);
      }
    }
  }

  const indexedAtStr = await redisClient.get("seasons:indexed");
  const indexedAt = indexedAtStr ? Number(indexedAtStr) : 0;
  const isIndexedFresh = now - indexedAt <= ONE_DAY;

  if (!isIndexedFresh && fetchedSeasonsCache) {
    const seasons = fetchedSeasonsCache
      .slice(offset, offset + pageSize)
      .map((year) => ({ year }));

    return {
      seasons,
      total: fetchedSeasonsCache.length,
      offset: offset + seasons.length,
    };
  }

  const searchResult = (await redisClient.sendCommand([
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

  if (fetchedSeasonsCache) fetchedSeasonsCache = null;

  return {
    seasons: hits,
    total,
    offset: offset + hits.length,
  };
}
