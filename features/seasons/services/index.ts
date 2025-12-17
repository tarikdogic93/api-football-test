import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { SeasonType } from "@/features/seasons/types";

const ONE_DAY = 24 * 60 * 60 * 1000;
const REF = doc(db, "meta", "seasons");

export async function fetchSeasonsFromAPI(): Promise<SeasonType[]> {
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
  return json.response as SeasonType[];
}

export async function getSeasons(): Promise<SeasonType[]> {
  const snapshot = await getDoc(REF);
  const cached: SeasonType[] = snapshot.exists()
    ? snapshot.data()?.seasons || []
    : [];
  const updatedAt: number = snapshot.exists()
    ? snapshot.data()?.updatedAt || 0
    : 0;

  const now = Date.now();
  const isFresh = updatedAt && now - updatedAt < ONE_DAY;

  if (isFresh) return cached;

  const fetchedSeasons: SeasonType[] = await fetchSeasonsFromAPI();

  await setDoc(REF, { seasons: fetchedSeasons, updatedAt: now });

  return fetchedSeasons;
}
