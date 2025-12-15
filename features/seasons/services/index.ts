import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { SeasonType } from "@/features/seasons/types";

const ONE_DAY = 24 * 60 * 60 * 1000;
const REF = doc(db, "meta", "seasons");

export async function getSeasons(): Promise<SeasonType[]> {
  const snapshot = await getDoc(REF);
  const cached = snapshot.exists() ? snapshot.data() : null;

  const isFresh =
    cached && cached.updatedAt && Date.now() - cached.updatedAt < ONE_DAY;

  let seasons: SeasonType[] = cached?.seasons || [];

  if (isFresh) {
    return seasons;
  }

  try {
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
    const fetchedSeasons: SeasonType[] = json.response;

    const hasChanged =
      seasons.length !== fetchedSeasons.length ||
      seasons.some((season, index) => season !== fetchedSeasons[index]);

    if (hasChanged) {
      await setDoc(
        REF,
        {
          seasons: fetchedSeasons,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      seasons = fetchedSeasons;
    }

    return seasons;
  } catch (error) {
    console.error("Failed to fetch API-Football seasons", error);

    if (!cached) {
      throw new Error("No cached seasons available");
    }

    return seasons;
  }
}
