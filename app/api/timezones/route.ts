import { NextResponse } from "next/server";

import { getTimezonesMap } from "@/features/timezones/services";

export async function GET() {
  try {
    const timezonesMap = await getTimezonesMap();
    const timezones = Object.values(timezonesMap);
    return NextResponse.json(timezones);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load timezones" },
      { status: 500 }
    );
  }
}
