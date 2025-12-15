import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { VenueType } from "@/features/venues/types";

const ONE_DAY = 24 * 60 * 60 * 1000;
const REF = doc(db, "meta", "venues");

export async function fetchVenueFromAPI(params: Record<string, string>) {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(
    `https://v3.football.api-sports.io/venues?${queryString}`,
    { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! } }
  );

  if (!response.ok) throw new Error(`API error ${response.status}`);

  const json = await response.json();
  return json.response as VenueType[];
}

export async function getVenue(
  params: Record<string, string>
): Promise<VenueType[]> {
  const snapshot = await getDoc(REF);
  const cached = snapshot.exists() ? snapshot.data()?.venues || {} : {};

  const now = Date.now();
  const matchedCachedVenues: VenueType[] = [];

  for (const venueId in cached) {
    const venue = cached[venueId];
    if (now - venue.updatedAt > ONE_DAY) continue;

    let isMatch = true;
    for (const key in params) {
      const paramValue = params[key].toLowerCase();
      const venueValue = (venue as Record<string, string | number>)[key]
        .toString()
        .toLowerCase();

      if (!venueValue.includes(paramValue)) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) {
      matchedCachedVenues.push(venue);
    }
  }

  if (matchedCachedVenues.length > 0) {
    return matchedCachedVenues;
  }

  const venues = await fetchVenueFromAPI(params);

  const updates: Record<string, any> = {};
  for (const venue of venues) {
    updates[venue.id] = { ...venue, updatedAt: now };
  }
  if (Object.keys(updates).length > 0) {
    await setDoc(REF, { venues: updates }, { merge: true });
  }

  return venues;
}
