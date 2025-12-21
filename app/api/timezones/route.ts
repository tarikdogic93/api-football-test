import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { getTimezones } from "@/features/timezones/services";

export async function GET(req: NextRequest) {
  try {
    const pageSizeParam = req.nextUrl.searchParams.get("pageSize");
    const cursor = req.nextUrl.searchParams.get("cursor");

    const pageSize = pageSizeParam
      ? parseInt(pageSizeParam, 10)
      : DEFAULT_PAGE_SIZE;

    if (pageSize < 1) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    const result = await getTimezones({
      pageSize,
      cursor,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load timezones" },
      { status: 500 }
    );
  }
}
