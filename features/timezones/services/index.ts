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
import {
  GetTimezonesParams,
  TimezonesAPIResponse,
  TimezoneType,
} from "@/features/timezones/types";

const TIMEZONES_COLLECTION = collection(db, "timezones");

function generateSafeDocumentId(name: string): string {
  return name
    .trim()
    .replace(/[\/\s]+/g, "_") // replace slashes or spaces with underscores
    .replace(/[^\w-]/g, ""); // remove characters that are not a-z, A-Z, 0-9, _, or -
}

export async function fetchTimezonesFromAPI(): Promise<string[]> {
  const response = await fetch("https://v3.football.api-sports.io/timezone", {
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  const json = await response.json();
  return json.response as string[];
}

let totalCountCache: number | null = null;

export async function getTimezones({
  pageSize,
  cursor,
}: GetTimezonesParams): Promise<TimezonesAPIResponse> {
  const snapshotCheck = await getDocs(query(TIMEZONES_COLLECTION, limit(1)));
  if (snapshotCheck.empty) {
    const fetchedTimezones = await fetchTimezonesFromAPI();
    const batch = writeBatch(db);

    for (const timezone of fetchedTimezones) {
      const documentId = generateSafeDocumentId(timezone);
      const timezoneData: TimezoneType = { name: timezone };
      batch.set(doc(TIMEZONES_COLLECTION, documentId), timezoneData);
    }

    await batch.commit();
  }

  if (totalCountCache === null) {
    const totalSnapshot = await getCountFromServer(TIMEZONES_COLLECTION);
    totalCountCache = totalSnapshot.data().count;
  }

  let q = query(TIMEZONES_COLLECTION, orderBy("name"), limit(pageSize));

  if (cursor) {
    q = query(
      TIMEZONES_COLLECTION,
      orderBy("name"),
      startAfter(cursor),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(q);
  const timezones = snapshot.docs.map((doc) => doc.data() as TimezoneType);

  const lastDoc = snapshot.docs[snapshot.docs.length - 1];
  const nextCursor = lastDoc ? lastDoc.get("name") : null;
  const hasNextPage = nextCursor !== null;

  return {
    total: totalCountCache,
    timezones,
    nextCursor,
    hasNextPage,
  };
}
