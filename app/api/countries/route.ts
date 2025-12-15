import { NextRequest, NextResponse } from "next/server";

import { getCountriesMap } from "@/features/countries/services";

export async function GET(req: NextRequest) {
  const nameQuery = req.nextUrl.searchParams.get("name")?.toLowerCase();
  const codeQuery = req.nextUrl.searchParams.get("code")?.toLowerCase();
  const searchQuery = req.nextUrl.searchParams.get("search")?.toLowerCase();

  try {
    const countriesMap = await getCountriesMap();

    let countries = Object.values(countriesMap);

    if (nameQuery) {
      countries = countries.filter(
        (country) => country.name.toLowerCase() === nameQuery
      );
    } else if (codeQuery) {
      countries = countries.filter(
        (country) => country.code?.toLowerCase() === codeQuery
      );
    } else if (searchQuery) {
      countries = countries.filter((country) =>
        country.name.toLowerCase().includes(searchQuery)
      );
    }

    return NextResponse.json(countries);
  } catch {
    return NextResponse.json(
      { error: "Failed to load countries" },
      { status: 500 }
    );
  }
}
