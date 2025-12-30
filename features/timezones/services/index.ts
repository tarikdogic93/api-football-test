import { collection, getDocs, limit, query } from "firebase/firestore";

import { JOB_NAMES, ONE_DAY } from "@/lib/constants";
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

const collectionPath = "timezones";
const TIMEZONES_COLLECTION = collection(db, collectionPath);
const REDIS_INDEX = collectionPath;
const REDIS_PREFIX = `${collectionPath}:`;

let fetchedTimezonesCache: string[] | null = null;

export async function fetchTimezonesFromAPI(): Promise<string[]> {
  const response = await fetch("https://v3.football.api-sports.io/timezone", {
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY!,
    },
  });

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
    indexName: REDIS_INDEX,
    prefix: REDIS_PREFIX,
    schema: [["name", "TEXT", "SORTABLE"]],
  });

  const snapshotCheck = await getDocs(query(TIMEZONES_COLLECTION, limit(1)));
  const shouldFetchAPI = snapshotCheck.empty;

  const lockKey = `${collectionPath}:fetch-lock`;

  if (shouldFetchAPI && !fetchedTimezonesCache) {
    const lockAcquired = await redisClient.set(lockKey, "1", {
      NX: true,
      EX: 10,
    });

    if (lockAcquired) {
      try {
        fetchedTimezonesCache = await fetchTimezonesFromAPI();

        await addBackgroundJob(JOB_NAMES.STORE_TIMEZONES, {
          timezones: fetchedTimezonesCache,
          timestamp: now,
          collectionPath,
          redisPrefix: REDIS_PREFIX,
        });
      } finally {
        await redisClient.del(lockKey);
      }
    }
  }

  const indexedAtStr = await redisClient.get(`${collectionPath}:indexed`);
  const indexedAt = indexedAtStr ? Number(indexedAtStr) : 0;
  const isIndexedFresh = now - indexedAt <= ONE_DAY;

  if (!isIndexedFresh && fetchedTimezonesCache) {
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
    REDIS_INDEX,
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
