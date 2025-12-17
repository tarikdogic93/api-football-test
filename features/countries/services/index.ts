import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { CountryType } from "@/features/countries/types";

const ONE_DAY = 24 * 60 * 60 * 1000;
const REF = doc(db, "meta", "countries");

export async function fetchCountriesFromAPI(): Promise<CountryType[]> {
  const response = await fetch("https://v3.football.api-sports.io/countries", {
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  const json = await response.json();
  return json.response as CountryType[];
}

export async function getCountriesMap(): Promise<Record<string, CountryType>> {
  const snapshot = await getDoc(REF);
  const cached = snapshot.exists() ? snapshot.data() : null;

  const isFresh =
    cached && cached.updatedAt && Date.now() - cached.updatedAt < ONE_DAY;

  if (isFresh && cached?.countries) {
    return cached.countries;
  }

  const fetchedCountries = await fetchCountriesFromAPI();

  const countriesMap: Record<string, CountryType> = {};
  for (const country of fetchedCountries) {
    if (country.code) {
      countriesMap[country.code] = {
        code: country.code,
        name: country.name,
        flag: country.flag,
      };
    }
  }

  await setDoc(REF, {
    countries: countriesMap,
    updatedAt: Date.now(),
  });

  return countriesMap;
}
