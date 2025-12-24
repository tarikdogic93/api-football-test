import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { getCountries } from "@/features/countries/services";

export async function GET(req: NextRequest) {
  try {
    const pageSizeParam = req.nextUrl.searchParams.get("pageSize");
    const offsetParam = req.nextUrl.searchParams.get("offset");
    const nameQuery = req.nextUrl.searchParams.get("name")?.toLowerCase();
    const codeQuery = req.nextUrl.searchParams.get("code")?.toLowerCase();
    const searchQuery = req.nextUrl.searchParams.get("search")?.toLowerCase();

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

    const result = await getCountries({
      pageSize,
      offset,
      nameQuery,
      codeQuery,
      searchQuery,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load countries" },
      { status: 500 }
    );
  }
}
