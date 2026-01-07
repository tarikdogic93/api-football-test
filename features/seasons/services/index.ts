import { collection, getDocs, limit, query } from "firebase/firestore";

import {
  API_FOOTBALL_CONSTANTS,
  JOB_NAMES,
  ONE_DAY,
  SEASONS_CONSTANTS,
} from "@/lib/constants";
import { db } from "@/lib/firebase";
import {
  ensureRedisConnected,
  ensureIndexOnce,
  parseRediSearchResults,
} from "@/lib/redis";
import { addBackgroundJob } from "@/lib/queue";
import { SeasonsAPIResponse, SeasonType } from "@/features/seasons/types";

type SeasonsParams = {
  pageSize: number;
  offset: number;
};

const SEASONS_COLLECTION = collection(db, SEASONS_CONSTANTS.COLLECTION_PATH);

let fetchedSeasonsCache: number[] | null = null;

export async function fetchSeasonsFromAPI(): Promise<number[]> {
  const response = await fetch(
    `${process.env.API_FOOTBALL_BASE_URL!}${SEASONS_CONSTANTS.API_ENDPOINT}`,
    {
      headers: {
        [API_FOOTBALL_CONSTANTS.HEADER_KEY_NAME]: process.env.API_FOOTBALL_KEY!,
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
}: SeasonsParams): Promise<SeasonsAPIResponse> {
  const now = Date.now();

  const redisClient = await ensureRedisConnected();

  await ensureIndexOnce({
    indexName: SEASONS_CONSTANTS.REDIS_INDEX,
    prefix: SEASONS_CONSTANTS.REDIS_PREFIX,
    schema: [["year", "NUMERIC", "SORTABLE"]],
  });

  const snapshot = await getDocs(query(SEASONS_COLLECTION, limit(1)));
  const isStale =
    snapshot.empty ||
    !snapshot.docs[0].data()?.updatedAt ||
    now - snapshot.docs[0].data().updatedAt > ONE_DAY;

  if (isStale) {
    const lockAcquired = await redisClient.set(
      SEASONS_CONSTANTS.REDIS_LOCK_KEY,
      "1",
      {
        NX: true,
        EX: 10,
      }
    );

    if (lockAcquired) {
      try {
        fetchedSeasonsCache = await fetchSeasonsFromAPI();

        await addBackgroundJob(JOB_NAMES.STORE_SEASONS, {
          seasons: fetchedSeasonsCache,
          timestamp: now,
        });
      } finally {
        await redisClient.del(SEASONS_CONSTANTS.REDIS_LOCK_KEY);
      }
    }
  }

  const indexedAtStr = await redisClient.get(
    SEASONS_CONSTANTS.REDIS_INDEXED_KEY
  );
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
    SEASONS_CONSTANTS.REDIS_INDEX,
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
