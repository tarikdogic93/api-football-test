import { NextResponse } from "next/server";

import { getSeasons } from "@/features/seasons/services";

export async function GET() {
  try {
    const seasons = await getSeasons();
    return NextResponse.json(seasons);
  } catch {
    return NextResponse.json(
      { error: "Failed to load seasons" },
      { status: 500 }
    );
  }
}
