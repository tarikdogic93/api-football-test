import { MeiliSearch } from "meilisearch";

const host = process.env.MEILI_HOST;
const apiKey = process.env.MEILI_API_KEY;

if (!host || !apiKey) {
  throw new Error("Missing MEILI_HOST or MEILI_API_KEY environment variables");
}

export const meiliClient = new MeiliSearch({ host, apiKey });

const indexInitPromises: Record<string, Promise<void>> = {};

export function ensureIndexOnce(params: {
  indexName: string;
  primaryKey: string;
  searchableAttributes: string[];
  filterableAttributes?: string[];
}) {
  const { indexName, primaryKey, searchableAttributes, filterableAttributes } =
    params;

  if (!indexInitPromises[indexName]) {
    indexInitPromises[indexName] = (async () => {
      try {
        await meiliClient.createIndex(indexName, { primaryKey });
      } catch (err: any) {
        if (err?.errorCode !== "index_already_exists") throw err;
      }

      const index = meiliClient.index(indexName);

      const searchTask = await index.updateSearchableAttributes(
        searchableAttributes
      );
      await meiliClient.tasks.waitForTask(searchTask.taskUid);

      if (filterableAttributes && filterableAttributes.length > 0) {
        const filterTask = await index.updateFilterableAttributes(
          filterableAttributes
        );
        await meiliClient.tasks.waitForTask(filterTask.taskUid);
      }
    })();
  }

  return indexInitPromises[indexName];
}
