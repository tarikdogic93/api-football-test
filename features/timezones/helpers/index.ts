import { ParsedTimezone } from "@/features/timezones/types";

export function parseTimezone(timezone: string): ParsedTimezone {
  if (!timezone) return {};

  const parts = timezone.split("/").map((part) => part.replace(/_/g, " "));

  const result: ParsedTimezone = {};

  if (parts[0]) result.continent = parts[0];
  if (parts[1]) result.region = parts[1];
  if (parts[2]) result.city = parts[2];

  return result;
}
