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

  const [key] = Object.keys(params);
  const paramValue = params[key].toLowerCase();

  const matchedCachedVenues: VenueType[] = [];
  let hasStale = false;

  for (const venueId in cached) {
    const venue = cached[venueId];

    const fieldValue = (
      venue as Record<string, string | number | null | undefined>
    )[key];
    if (!fieldValue) continue;

    const venueValue = fieldValue.toString().toLowerCase();
    const isMatch = venueValue === paramValue;

    if (isMatch) {
      matchedCachedVenues.push(venue);
      if (now - venue.updatedAt > ONE_DAY) hasStale = true;
    }
  }

  const broaderSearchKeys = ["city", "country", "search"];
  const isBroaderSearch = broaderSearchKeys.includes(key);

  const needApiCall =
    isBroaderSearch || hasStale || matchedCachedVenues.length === 0;

  if (!needApiCall) return matchedCachedVenues;

  const venues = await fetchVenueFromAPI(params);

  const updates: Record<string, any> = {};
  for (const venue of venues) {
    updates[venue.id] = { ...venue, updatedAt: now };
  }
  if (Object.keys(updates).length > 0) {
    await setDoc(REF, { venues: updates }, { merge: true });
  }

  const allResults = [...matchedCachedVenues];
  const cachedIds = new Set(matchedCachedVenues.map((venue) => venue.id));
  for (const venue of venues) {
    if (!cachedIds.has(venue.id)) {
      allResults.push(venue);
    }
  }

  return allResults;
}
