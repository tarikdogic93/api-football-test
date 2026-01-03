import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { getCountries } from "@/features/countries/services";
import { searchCountriesSchema } from "@/features/countries/schemas";

export async function GET(req: NextRequest) {
  try {
    const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());

    const validatedQuery = searchCountriesSchema.parse({
      name: queryParams.name,
      code: queryParams.code,
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

    const result = await getCountries({
      pageSize,
      offset,
      nameQuery: validatedQuery.name,
      codeQuery: validatedQuery.code,
      searchQuery: validatedQuery.search,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load countries" },
      { status: 500 }
    );
  }
}
