import { doc, getDoc, setDoc, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CountryType } from "@/features/countries/types";

const ONE_DAY = 24 * 60 * 60 * 1000;
const REF = doc(db, "meta", "countries");

export async function getCountriesMap(): Promise<Record<string, CountryType>> {
  const snapshot = await getDoc(REF);
  const cached = snapshot.exists() ? snapshot.data() : null;

  const isFresh =
    cached && cached.updatedAt && Date.now() - cached.updatedAt < ONE_DAY;

  let countriesMap: Record<string, CountryType> = cached?.countries || {};

  if (isFresh) {
    return countriesMap;
  }

  try {
    const response = await fetch(
      "https://v3.football.api-sports.io/countries",
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
    const fetchedCountries = json.response;

    const fetchedMap: Record<string, CountryType> = {};

    for (const c of fetchedCountries) {
      if (c.code) {
        fetchedMap[c.code] = {
          code: c.code,
          name: c.name,
          flag: c.flag,
        };
      }
    }

    const updates: Record<string, CountryType> = {};
    const deletes: string[] = [];

    for (const [code, country] of Object.entries(fetchedMap)) {
      if (
        !countriesMap[code] ||
        JSON.stringify(countriesMap[code]) !== JSON.stringify(country)
      ) {
        updates[code] = country;
      }
    }

    for (const code of Object.keys(countriesMap)) {
      if (!fetchedMap[code]) {
        deletes.push(code);
      }
    }

    if (Object.keys(updates).length > 0) {
      await setDoc(
        REF,
        {
          countries: updates,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    }

    for (const code of deletes) {
      await setDoc(
        REF,
        { [`countries.${code}`]: deleteField() },
        { merge: true }
      );
    }

    return {
      ...countriesMap,
      ...updates,
    };
  } catch (error) {
    console.error("Failed to fetch API-Football", error);

    if (!cached) {
      throw new Error("No cached countries available");
    }

    return countriesMap;
  }
}
