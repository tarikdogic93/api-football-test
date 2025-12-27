import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { searchVenuesSchema } from "@/features/venues/schemas";
import { getVenues } from "@/features/venues/services";

export async function GET(req: NextRequest) {
  try {
    const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());

    const validatedQuery = searchVenuesSchema.parse({
      id: queryParams.id,
      name: queryParams.name,
      city: queryParams.city,
      country: queryParams.country,
      search: queryParams.search,
    });

    const pageSizeParam = queryParams.pageSize;
    const offsetParam = queryParams.offset;

    const pageSize = pageSizeParam
      ? parseInt(pageSizeParam, 10)
      : DEFAULT_PAGE_SIZE;

    if (pageSize < 1) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    const result = await getVenues({
      idQuery: validatedQuery.id,
      nameQuery: validatedQuery.name,
      cityQuery: validatedQuery.city,
      countryQuery: validatedQuery.country,
      searchQuery: validatedQuery.search,
      pageSize,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load venues" },
      { status: 500 }
    );
  }
}
