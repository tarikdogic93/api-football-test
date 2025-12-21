import { NextRequest, NextResponse } from "next/server";

import { getTimezones } from "@/features/timezones/services";

const DEFAULT_PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  try {
    const pageParam = req.nextUrl.searchParams.get("page");
    const pageSizeParam = req.nextUrl.searchParams.get("pageSize");

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam
      ? parseInt(pageSizeParam, 10)
      : DEFAULT_PAGE_SIZE;

    if (page < 1) {
      return NextResponse.json(
        { error: "Invalid page number" },
        { status: 400 }
      );
    }

    const { timezones, total } = await getTimezones(page, pageSize);

    return NextResponse.json({
      page,
      timezones,
      total,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load timezones" },
      { status: 500 }
    );
  }
}
