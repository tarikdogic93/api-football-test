import { collection, getDocs, limit, query } from "firebase/firestore";

import {
  API_FOOTBALL_CONSTANTS,
  JOB_NAMES,
  TIMEZONES_CONSTANTS,
} from "@/lib/constants";
import { db } from "@/lib/firebase";
import {
  ensureRedisConnected,
  ensureIndexOnce,
  parseRediSearchResults,
} from "@/lib/redis";
import { addBackgroundJob } from "@/lib/queue";
import { TimezonesAPIResponse, TimezoneType } from "@/features/timezones/types";

type TimezonesParams = {
  pageSize: number;
  offset: number;
};

const TIMEZONES_COLLECTION = collection(
  db,
  TIMEZONES_CONSTANTS.COLLECTION_PATH
);

let fetchedTimezonesCache: string[] | null = null;

export async function fetchTimezonesFromAPI(): Promise<string[]> {
  const response = await fetch(
    `${process.env.API_FOOTBALL_BASE_URL!}${TIMEZONES_CONSTANTS.API_ENDPOINT}`,
    {
      headers: {
        [API_FOOTBALL_CONSTANTS.HEADER_KEY_NAME]: process.env.API_FOOTBALL_KEY!,
      },
    }
  );

  if (!response.ok) throw new Error(`API error ${response.status}`);
  const json = await response.json();
  return json.response as string[];
}

export async function getTimezones({
  pageSize,
  offset,
}: TimezonesParams): Promise<TimezonesAPIResponse> {
  const now = Date.now();
  const redisClient = await ensureRedisConnected();

  await ensureIndexOnce({
    indexName: TIMEZONES_CONSTANTS.REDIS_INDEX,
    prefix: TIMEZONES_CONSTANTS.REDIS_PREFIX,
    schema: [["name", "TEXT", "SORTABLE"]],
  });

  const snapshot = await getDocs(query(TIMEZONES_COLLECTION, limit(1)));
  const shouldFetchAPI = snapshot.empty;

  if (shouldFetchAPI) {
    const lockAcquired = await redisClient.set(
      TIMEZONES_CONSTANTS.REDIS_LOCK_KEY,
      "1",
      {
        NX: true,
        EX: 10,
      }
    );

    if (lockAcquired) {
      try {
        fetchedTimezonesCache = await fetchTimezonesFromAPI();

        await addBackgroundJob(JOB_NAMES.STORE_TIMEZONES, {
          timezones: fetchedTimezonesCache,
          timestamp: now,
        });
      } finally {
        await redisClient.del(TIMEZONES_CONSTANTS.REDIS_LOCK_KEY);
      }
    }
  }

  const isIndexed = await redisClient.get(
    TIMEZONES_CONSTANTS.REDIS_INDEXED_KEY
  );

  if (!isIndexed && fetchedTimezonesCache) {
    const timezones = fetchedTimezonesCache
      .slice(offset, offset + pageSize)
      .map((name) => ({ name }));

    return {
      timezones,
      total: fetchedTimezonesCache.length,
      offset: offset + timezones.length,
    };
  }

  const searchResult = (await redisClient.sendCommand([
    "FT.SEARCH",
    TIMEZONES_CONSTANTS.REDIS_INDEX,
    "*",
    "RETURN",
    "1",
    "$.name",
    "LIMIT",
    offset.toString(),
    pageSize.toString(),
  ])) as any[];

  const total = searchResult[0] as number;

  const rawHits = parseRediSearchResults<Record<string, string>>(searchResult, [
    "$.name",
  ]);

  const hits: TimezoneType[] = rawHits.map((hit) => ({
    name: hit["$.name"],
  }));

  if (fetchedTimezonesCache) fetchedTimezonesCache = null;

  return {
    timezones: hits,
    total,
    offset: offset + hits.length,
  };
}
