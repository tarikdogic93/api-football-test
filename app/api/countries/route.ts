import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, setDoc, deleteField } from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function GET(req: NextRequest) {
  const nameQuery = req.nextUrl.searchParams.get("name")?.toLowerCase();
  const codeQuery = req.nextUrl.searchParams.get("code")?.toLowerCase();
  const searchQuery = req.nextUrl.searchParams.get("search")?.toLowerCase();

  const ref = doc(db, "meta", "countries");
  const snapshot = await getDoc(ref);
  const cached = snapshot.exists() ? snapshot.data() : null;

  const oneDay = 24 * 60 * 60 * 1000;
  const isFresh = cached && Date.now() - cached.updatedAt < oneDay;

  let countriesMap: Record<string, any> = cached?.countries || {};

  if (!isFresh) {
    try {
      const response = await fetch(
        "https://v3.football.api-sports.io/countries",
        {
          headers: {
            "x-apisports-key": process.env.API_FOOTBALL_KEY!,
          },
        }
      );

      if (!response.ok) throw new Error(`API error ${response.status}`);

      const json = await response.json();
      const fetchedCountries = json.response;

      const fetchedCountriesMap: Record<string, any> = {};
      for (const country of fetchedCountries) {
        if (country.code)
          fetchedCountriesMap[country.code] = {
            name: country.name,
            flag: country.flag,
          };
      }

      const updates: Record<string, any> = {};
      const deletes: string[] = [];

      for (const [code, country] of Object.entries(fetchedCountriesMap)) {
        if (
          !countriesMap[code] ||
          JSON.stringify(countriesMap[code]) !== JSON.stringify(country)
        ) {
          updates[code] = country;
        }
      }

      for (const code of Object.keys(countriesMap)) {
        if (!fetchedCountriesMap[code]) {
          deletes.push(code);
        }
      }

      if (Object.keys(updates).length > 0) {
        await setDoc(
          ref,
          { countries: updates, updatedAt: Date.now() },
          { merge: true }
        );
        Object.assign(countriesMap, updates);
      }

      for (const code of deletes) {
        await setDoc(
          ref,
          { [`countries.${code}`]: deleteField() },
          { merge: true }
        );
        delete countriesMap[code];
      }
    } catch (error) {
      console.error("Failed to fetch API-Football", error);

      if (!cached) {
        return NextResponse.json(
          { error: "Failed to fetch countries and no cached data available" },
          { status: 500 }
        );
      }
    }
  }

  let countriesArray = Object.entries(countriesMap).map(([code, data]) => ({
    code,
    flag: data.flag,
    name: data.name,
  }));

  if (nameQuery) {
    countriesArray = countriesArray.filter(
      (country) => country.name.toLowerCase() === nameQuery
    );
  } else if (codeQuery) {
    countriesArray = countriesArray.filter(
      (country) => country.code?.toLowerCase() === codeQuery
    );
  } else if (searchQuery) {
    countriesArray = countriesArray.filter((country) =>
      country.name.toLowerCase().includes(searchQuery)
    );
  }

  return NextResponse.json(countriesArray);
}
