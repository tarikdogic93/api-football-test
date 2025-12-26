import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("Missing REDIS_URL environment variable");
}

export const redis = createClient({ url: redisUrl });

redis.on("error", (err) => console.error("Redis Client Error:", err));

async function ensureConnected() {
  if (!redis.isOpen) {
    await redis.connect();
  }
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
      await ensureConnected();

      try {
        const schemaFlattened = schema.flatMap(([field, type, option]) =>
          option
            ? [`$.${field}`, "AS", field, type, option]
            : [`$.${field}`, "AS", field, type]
        );

        await redis.sendCommand([
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
  await ensureConnected();

  const pipeline = redis.multi();

  for (const doc of docs) {
    const id = String(doc[idField]);
    const key = `${prefix}${id}`;

    pipeline.json.set(key, "$", doc);
  }

  await pipeline.exec();
}
