import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  getCountFromServer,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { ONE_DAY } from "@/lib/constants";
import {
  GetSeasonsParams,
  SeasonsAPIResponse,
  SeasonType,
} from "@/features/seasons/types";

const SEASONS_COLLECTION = collection(db, "seasons");

function generateSafeDocumentId(year: number): string {
  return String(year);
}

export async function fetchSeasonsFromAPI(): Promise<number[]> {
  const response = await fetch(
    "https://v3.football.api-sports.io/leagues/seasons",
    {
      headers: {
        "x-apisports-key": process.env.API_FOOTBALL_KEY!,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  const json = await response.json();
  return json.response as number[];
}

let totalCountCache: number | null = null;

export async function getSeasons({
  pageSize,
  cursor,
}: GetSeasonsParams): Promise<SeasonsAPIResponse> {
  const now = Date.now();

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
      const documentId = generateSafeDocumentId(season);
      const seasonData: SeasonType & { updatedAt: number } = {
        year: season,
        updatedAt: now,
      };
      batch.set(doc(SEASONS_COLLECTION, documentId), seasonData);
    }

    await batch.commit();
  }

  if (totalCountCache === null) {
    const totalSnapshot = await getCountFromServer(SEASONS_COLLECTION);
    totalCountCache = totalSnapshot.data().count;
  }

  let q = query(SEASONS_COLLECTION, orderBy("year"), limit(pageSize));

  if (cursor) {
    q = query(
      SEASONS_COLLECTION,
      orderBy("year"),
      startAfter(Number(cursor)),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(q);
  const seasons = snapshot.docs.map((doc) => doc.data() as SeasonType);

  const lastDoc = snapshot.docs[snapshot.docs.length - 1];
  const nextCursor = lastDoc ? String(lastDoc.get("year")) : null;
  const hasNextPage = nextCursor !== null;

  return {
    total: totalCountCache,
    seasons,
    nextCursor,
    hasNextPage,
  };
}
