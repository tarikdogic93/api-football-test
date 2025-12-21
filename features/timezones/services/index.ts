import { collection, doc, getDocs, writeBatch } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { TimezoneType } from "@/features/timezones/types";

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

export async function getTimezonesMap(): Promise<Record<string, TimezoneType>> {
  const snapshot = await getDocs(TIMEZONES_COLLECTION);

  if (!snapshot.empty) {
    return Object.fromEntries(
      snapshot.docs.map((documentSnapshot) => [
        documentSnapshot.id,
        documentSnapshot.data() as TimezoneType,
      ])
    );
  }

  const fetchedTimezones = await fetchTimezonesFromAPI();
  const batch = writeBatch(db);
  const timezonesMap: Record<string, TimezoneType> = {};

  for (const timezone of fetchedTimezones) {
    const documentId = generateSafeDocumentId(timezone);
    const timezoneData: TimezoneType = { name: timezone };

    const timezoneDocumentReference = doc(TIMEZONES_COLLECTION, documentId);
    batch.set(timezoneDocumentReference, timezoneData);

    timezonesMap[documentId] = timezoneData;
  }

  await batch.commit();

  return timezonesMap;
}
