import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { searchTeamsSchema } from "@/features/teams/schemas";
import { getTeams } from "@/features/teams/services";

export async function GET(req: NextRequest) {
  try {
    const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());

    const validatedQuery = searchTeamsSchema.parse({
      id: queryParams.id,
      name: queryParams.name,
      league: queryParams.league,
      season: queryParams.season,
      country: queryParams.country,
      code: queryParams.code,
      venue: queryParams.venue,
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

    const result = await getTeams({
      idQuery: validatedQuery.id,
      nameQuery: validatedQuery.name,
      leagueQuery: validatedQuery.league,
      seasonQuery: validatedQuery.season,
      countryQuery: validatedQuery.country,
      codeQuery: validatedQuery.code,
      venueQuery: validatedQuery.venue,
      searchQuery: validatedQuery.search,
      pageSize,
      offset,
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
      { error: "Failed to load teams" },
      { status: 500 }
    );
  }
}
