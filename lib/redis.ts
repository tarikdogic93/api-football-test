import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error("Missing REDIS_URL environment variable");
    }

    redisClient = createClient({ url: redisUrl });

    redisClient.on("error", (err) => console.error("Redis Client Error:", err));
  }

  return redisClient;
}

export async function ensureRedisConnected() {
  const redisClient = getRedisClient();
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

type SchemaFieldType = "NUMERIC" | "TEXT" | "TAG" | "GEO";

const indexInitPromises: Record<string, Promise<void>> = {};

export async function ensureIndexOnce(params: {
  indexName: string;
  prefix: string;
  schema: [string, SchemaFieldType, "SORTABLE"?][];
}) {
  const { indexName, prefix, schema } = params;

  if (!indexInitPromises[indexName]) {
    indexInitPromises[indexName] = (async () => {
      const redisClient = await ensureRedisConnected();

      try {
        const schemaFlattened = schema.flatMap(([field, type, option]) =>
          option
            ? [`$.${field}`, "AS", field, type, option]
            : [`$.${field}`, "AS", field, type]
        );

        await redisClient.sendCommand([
          "FT.CREATE",
          indexName,
          "ON",
          "JSON",
          "PREFIX",
          "1",
          prefix,
          "SCHEMA",
          ...schemaFlattened,
        ]);
      } catch (err: any) {
        if (!err?.message?.includes("Index already exists")) {
          throw err;
        }
      }
    })();
  }

  return indexInitPromises[indexName];
}

export async function addDocuments(
  prefix: string,
  docs: Record<string, any>[],
  idField: string
) {
  const redisClient = await ensureRedisConnected();

  const pipeline = redisClient.multi();

  for (const doc of docs) {
    const id = String(doc[idField]);
    const key = `${prefix}${id}`;

    pipeline.json.set(key, "$", doc);
  }

  await pipeline.exec();
}

function getFieldsObject(fields: string[], fieldNames: string[]) {
  const result: Record<string, string | null> = {};

  fieldNames.forEach((name) => {
    const index = fields.findIndex((item) => item === name);
    result[name] = index !== -1 ? fields[index + 1] : null;
  });

  return result;
}

export function parseRediSearchResults<T>(
  searchResult: string[][],
  fieldNames: string[]
): T[] {
  const hits: T[] = [];

  for (let i = 1; i < searchResult.length; i += 2) {
    const fields = searchResult[i + 1] as string[];
    const obj = getFieldsObject(fields, fieldNames);
    hits.push(obj as T);
  }

  return hits;
}
