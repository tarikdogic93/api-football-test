import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { meiliClient, ensureIndexOnce } from "@/lib/meilisearch";
import {
  GetTimezonesParams,
  TimezonesAPIResponse,
  TimezoneType,
} from "@/features/timezones/types";

const TIMEZONES_COLLECTION = collection(db, "timezones");
const MEILI_INDEX = meiliClient.index("timezones");

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
    indexName: "timezones",
    primaryKey: "id",
    searchableAttributes: ["name"],
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

    const task = await MEILI_INDEX.addDocuments(
      fetchedTimezones.map((timezone) => ({
        id: generateSafeDocumentId(timezone),
        name: timezone,
      }))
    );

    await meiliClient.tasks.waitForTask(task.taskUid);
  }

  const result = await MEILI_INDEX.search<TimezoneType>("", {
    limit: pageSize,
    offset,
  });

  return {
    timezones: result.hits,
    total: result.estimatedTotalHits ?? result.hits.length,
    offset: offset + result.hits.length,
  };
}
