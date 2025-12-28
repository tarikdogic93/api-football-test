import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { getSeasons } from "@/features/seasons/services";

export async function GET(req: NextRequest) {
  try {
    const pageSizeParam = req.nextUrl.searchParams.get("pageSize");
    const offsetParam = req.nextUrl.searchParams.get("offset");

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

    const result = await getSeasons({
      pageSize,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { error: "Failed to load seasons" },
      { status: 500 }
    );
  }
}
