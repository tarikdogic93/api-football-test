import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { redis, ensureIndexOnce, addDocuments } from "@/lib/redis";
import {
  GetTimezonesParams,
  TimezonesAPIResponse,
  TimezoneType,
} from "@/features/timezones/types";

const TIMEZONES_COLLECTION = collection(db, "timezones");
const REDIS_INDEX = "timezones";
const REDIS_PREFIX = "timezones:";

function generateSafeDocumentId(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
}

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
}: GetTimezonesParams): Promise<TimezonesAPIResponse> {
  await ensureIndexOnce({
    indexName: REDIS_INDEX,
    prefix: REDIS_PREFIX,
    schema: [["name", "TEXT", "SORTABLE"]],
  });

  const snapshotCheck = await getDocs(query(TIMEZONES_COLLECTION, limit(1)));
  if (snapshotCheck.empty) {
    const fetchedTimezones = await fetchTimezonesFromAPI();
    const batch = writeBatch(db);

    for (const timezone of fetchedTimezones) {
      const documentId = generateSafeDocumentId(timezone);
      batch.set(doc(TIMEZONES_COLLECTION, documentId), { name: timezone });
    }

    await batch.commit();

    await addDocuments(
      REDIS_PREFIX,
      fetchedTimezones.map((timezone) => ({ name: timezone })),
      "name"
    );
  }

  const searchResult = (await redis.sendCommand([
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
  const hits: TimezoneType[] = [];

  for (
    let resultIndex = 1;
    resultIndex < searchResult.length;
    resultIndex += 2
  ) {
    const fieldArray = searchResult[resultIndex + 1] as string[];
    const nameFieldPosition = fieldArray.findIndex(
      (fieldName) => fieldName === "$.name"
    );

    if (nameFieldPosition >= 0 && fieldArray[nameFieldPosition + 1]) {
      hits.push({ name: fieldArray[nameFieldPosition + 1] });
    }
  }

  return {
    timezones: hits,
    total,
    offset: offset + hits.length,
  };
}
