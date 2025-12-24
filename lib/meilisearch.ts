import { MeiliSearch } from "meilisearch";

const host = process.env.MEILI_HOST;
const apiKey = process.env.MEILI_API_KEY;

if (!host || !apiKey) {
  throw new Error("Missing MEILI_HOST or MEILI_API_KEY environment variables");
}

export const meiliClient = new MeiliSearch({ host, apiKey });
