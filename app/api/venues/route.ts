import { NextRequest, NextResponse } from "next/server";

import { getVenue } from "@/features/venues/services";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.toLowerCase();
  const name = req.nextUrl.searchParams.get("name")?.toLowerCase();
  const city = req.nextUrl.searchParams.get("city")?.toLowerCase();
  const country = req.nextUrl.searchParams.get("country")?.toLowerCase();
  const search = req.nextUrl.searchParams.get("search")?.toLowerCase();

  try {
    if (!id && !name && !city && !country && !search) {
      return NextResponse.json(
        { error: "Please provide at least one query parameter" },
        { status: 400 }
      );
    }

    const params: Record<string, string> = {};
    if (id) params.id = id;
    if (name) params.name = name;
    if (city) params.city = city;
    if (country) params.country = country;
    if (search) params.search = search;

    const venues = await getVenue(params);

    return NextResponse.json(venues);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load venues" },
      { status: 500 }
    );
  }
}
