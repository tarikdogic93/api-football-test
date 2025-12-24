import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { getVenues } from "@/features/venues/services";

export async function GET(req: NextRequest) {
  try {
    const pageSizeParam = req.nextUrl.searchParams.get("pageSize");
    const offsetParam = req.nextUrl.searchParams.get("offset");
    const idQuery = req.nextUrl.searchParams.get("id")?.toLowerCase();
    const nameQuery = req.nextUrl.searchParams.get("name")?.toLowerCase();
    const cityQuery = req.nextUrl.searchParams.get("city")?.toLowerCase();
    const countryQuery = req.nextUrl.searchParams.get("country")?.toLowerCase();
    const searchQuery = req.nextUrl.searchParams.get("search")?.toLowerCase();

    if (!idQuery && !nameQuery && !cityQuery && !countryQuery && !searchQuery) {
      return NextResponse.json(
        { error: "Please provide at least one query parameter" },
        { status: 400 }
      );
    }

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
      idQuery,
      nameQuery,
      cityQuery,
      countryQuery,
      searchQuery,
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
