import {
  collection,
  doc,
  getDocs,
  limit,
  writeBatch,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { meiliClient, ensureIndexOnce } from "@/lib/meilisearch";
import { ONE_DAY } from "@/lib/constants";
import {
  GetSeasonsParams,
  SeasonsAPIResponse,
  SeasonType,
} from "@/features/seasons/types";

const SEASONS_COLLECTION = collection(db, "seasons");
const MEILI_INDEX = meiliClient.index("seasons");

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
    indexName: "seasons",
    primaryKey: "year",
    searchableAttributes: ["year"],
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

    const task = await MEILI_INDEX.addDocuments(
      fetchedSeasons.map((season) => ({ year: season }))
    );
    await meiliClient.tasks.waitForTask(task.taskUid);
  }

  const result = await MEILI_INDEX.search<SeasonType>("", {
    limit: pageSize,
    offset,
  });

  return {
    seasons: result.hits,
    total: result.estimatedTotalHits ?? result.hits.length,
    offset: offset + result.hits.length,
  };
}
