import { API_FOOTBALL_CONSTANTS } from "@/lib/constants";

type FetchAPIOptions<T> = {
  endpoint: string;
  query?: Record<string, string | undefined>;
  transform?: (json: any) => T;
};

export async function fetchFromAPIFootball<T>({
  endpoint,
  query,
  transform,
}: FetchAPIOptions<T>): Promise<T> {
  const params = new URLSearchParams();

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
  }

  const url = `${process.env.API_FOOTBALL_BASE_URL!}${endpoint}${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const response = await fetch(url, {
    headers: {
      [API_FOOTBALL_CONSTANTS.HEADER_KEY_NAME]: process.env.API_FOOTBALL_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  const json = await response.json();
  return transform ? transform(json) : json.response;
}
