import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  getDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { JOB_NAMES, ONE_DAY, TEAMS_CONSTANTS } from "@/lib/constants";
import { exactKey, getQueryIndexedKey, normalizeString } from "@/lib/utils";
import {
  ensureRedisConnected,
  ensureIndexOnce,
  parseRediSearchResults,
} from "@/lib/redis";
import { addBackgroundJob } from "@/lib/queue";
import { TeamsAPIResponse, TeamType } from "@/features/teams/types";

const TEAMS_COLLECTION = collection(db, TEAMS_CONSTANTS.COLLECTION_PATH);

let fetchedTeamsCache: Record<string, TeamType[]> = {};
let lastFetchedQuerySignatures: Record<string, number> = {};

type TeamsQueryParams = {
  idQuery?: string;
  nameQuery?: string;
  leagueQuery?: string;
  seasonQuery?: string;
  countryQuery?: string;
  codeQuery?: string;
  venueQuery?: string;
  searchQuery?: string;
};

type TeamsParams = TeamsQueryParams & {
  pageSize: number;
  offset: number;
};

function buildTeamsQuerySignature(params: TeamsQueryParams) {
  return JSON.stringify({
    idQuery: params.idQuery ?? null,
    nameQuery: params.nameQuery ? normalizeString(params.nameQuery) : null,
    leagueQuery: params.leagueQuery ?? null,
    seasonQuery: params.seasonQuery ?? null,
    countryQuery: params.countryQuery
      ? normalizeString(params.countryQuery)
      : null,
    codeQuery: params.codeQuery ?? null,
    venueQuery: params.venueQuery ?? null,
    searchQuery: params.searchQuery
      ? normalizeString(params.searchQuery)
      : null,
  });
}

export async function fetchTeamsFromAPI(query: TeamsQueryParams) {
  const params = new URLSearchParams();

  if (query.idQuery) params.set("id", query.idQuery);
  if (query.nameQuery) params.set("name", query.nameQuery);
  if (query.leagueQuery) params.set("league", query.leagueQuery);
  if (query.seasonQuery) params.set("season", query.seasonQuery);
  if (query.countryQuery) params.set("country", query.countryQuery);
  if (query.codeQuery) params.set("code", query.codeQuery);
  if (query.venueQuery) params.set("venue", query.venueQuery);
  if (query.searchQuery) params.set("search", query.searchQuery);

  const response = await fetch(
    `https://v3.football.api-sports.io/teams?${params.toString()}`,
    { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! } }
  );

  if (!response.ok) throw new Error(`API error ${response.status}`);

  const json = await response.json();
  const teams: TeamType[] = json.response.map((item: any) => item.team);

  return teams;
}

export async function getTeams({
  pageSize,
  offset,
  idQuery,
  nameQuery,
  leagueQuery,
  seasonQuery,
  countryQuery,
  codeQuery,
  venueQuery,
  searchQuery,
}: TeamsParams): Promise<TeamsAPIResponse> {
  const now = Date.now();

  const redisClient = await ensureRedisConnected();

  await ensureIndexOnce({
    indexName: TEAMS_CONSTANTS.REDIS_INDEX,
    prefix: TEAMS_CONSTANTS.REDIS_PREFIX,
    schema: [
      ["id", "TAG"],
      ["name_exact", "TAG"],
      ["name_search", "TEXT"],
      ["country_exact", "TAG"],
      ["country_search", "TEXT"],
      ["code", "TAG"],
      ["leagueId", "TAG"],
      ["season", "TAG"],
      ["venueId", "TAG"],
    ],
  });

  const currentQuerySignature = buildTeamsQuerySignature({
    idQuery,
    nameQuery,
    leagueQuery,
    seasonQuery,
    countryQuery,
    codeQuery,
    venueQuery,
    searchQuery,
  });

  const isSameQueryAsLastTime =
    !!lastFetchedQuerySignatures[currentQuerySignature];

  const normalizedQueryValues = [countryQuery, searchQuery]
    .filter(Boolean)
    .map(normalizeString);

  let isStale = false;

  if (!isSameQueryAsLastTime) {
    if (idQuery) {
      const docSnap = await getDoc(doc(TEAMS_COLLECTION, idQuery));
      isStale =
        !docSnap.exists() ||
        !docSnap.data()?.updatedAt ||
        now - docSnap.data().updatedAt > ONE_DAY;
    } else if (nameQuery) {
      const snapshot = await getDocs(
        query(
          TEAMS_COLLECTION,
          where("nameNormalized", "==", normalizeString(nameQuery)),
          limit(1)
        )
      );
      isStale =
        snapshot.empty ||
        !snapshot.docs[0].data()?.updatedAt ||
        now - snapshot.docs[0].data().updatedAt > ONE_DAY;
    } else if (normalizedQueryValues.length > 0) {
      const snapshotPromises = normalizedQueryValues.map((value) =>
        getDocs(
          query(
            TEAMS_COLLECTION,
            where("queriedValues", "array-contains", value),
            limit(1)
          )
        )
      );

      const snapshots = await Promise.all(snapshotPromises);
      isStale = snapshots.every(
        (snap) =>
          snap.empty ||
          !snap.docs[0]?.data()?.updatedAt ||
          now - snap.docs[0].data().updatedAt > ONE_DAY
      );
    }
  }

  const shouldFetchAPI = !isSameQueryAsLastTime && isStale;

  if (shouldFetchAPI) {
    const lockKey = `${TEAMS_CONSTANTS.REDIS_LOCK_KEY}:${currentQuerySignature}`;
    const lockAcquired = await redisClient.set(lockKey, "1", {
      NX: true,
      EX: 10,
    });

    if (lockAcquired) {
      try {
        fetchedTeamsCache[currentQuerySignature] = await fetchTeamsFromAPI({
          idQuery,
          nameQuery,
          leagueQuery,
          seasonQuery,
          countryQuery,
          codeQuery,
          venueQuery,
          searchQuery,
        });

        if (fetchedTeamsCache[currentQuerySignature].length > 0) {
          await addBackgroundJob(JOB_NAMES.STORE_TEAMS, {
            teams: fetchedTeamsCache[currentQuerySignature],
            timestamp: now,
            querySignature: currentQuerySignature,
            queryValues: normalizedQueryValues,
            leagueQuery,
            seasonQuery,
            venueQuery,
          });

          lastFetchedQuerySignatures[currentQuerySignature] = now;
        }
      } finally {
        await redisClient.del(lockKey);
      }
    }
  }

  const queryIndexedKey = getQueryIndexedKey(
    TEAMS_CONSTANTS.REDIS_INDEXED_KEY,
    currentQuerySignature
  );
  const indexedAtStr = await redisClient.get(queryIndexedKey);
  const indexedAt = indexedAtStr ? Number(indexedAtStr) : 0;
  const isIndexedFresh = now - indexedAt <= ONE_DAY;

  if (!isIndexedFresh && fetchedTeamsCache[currentQuerySignature]) {
    const cachedTeams = fetchedTeamsCache[currentQuerySignature] ?? [];
    const paginatedTeams = cachedTeams.slice(offset, offset + pageSize);

    return {
      teams: paginatedTeams,
      total: cachedTeams.length,
      offset: offset + paginatedTeams.length,
    };
  }

  const filters: string[] = [];

  if (idQuery) filters.push(`@id:{${idQuery}}`);
  if (nameQuery) filters.push(`@name_exact:{${exactKey(nameQuery)}}`);
  if (countryQuery) filters.push(`@country_exact:{${exactKey(countryQuery)}}`);
  if (codeQuery) filters.push(`@code:{${codeQuery}}`);
  if (leagueQuery) filters.push(`@leagueId:{${leagueQuery}}`);
  if (seasonQuery) filters.push(`@season:{${seasonQuery}}`);
  if (venueQuery) filters.push(`@venueId:{${venueQuery}}`);
  if (searchQuery)
    filters.push(
      `(@name_search|country_search:*${normalizeString(searchQuery)}*)`
    );

  const searchQueryString = filters.length > 0 ? filters.join(" ") : "*";

  const searchResult = (await redisClient.sendCommand([
    "FT.SEARCH",
    TEAMS_CONSTANTS.REDIS_INDEX,
    searchQueryString,
    "LIMIT",
    offset.toString(),
    pageSize.toString(),
    "RETURN",
    "8",
    "$.id",
    "$.name",
    "$.country",
    "$.code",
    "$.leagueId",
    "$.season",
    "$.venueId",
    "$.logo",
    "DIALECT",
    "2",
  ])) as any[];

  const total = searchResult[0] as number;

  const rawHits = parseRediSearchResults<Record<string, string | null>>(
    searchResult,
    [
      "$.id",
      "$.name",
      "$.country",
      "$.code",
      "$.leagueId",
      "$.season",
      "$.venueId",
      "$.logo",
    ]
  );

  const hits: TeamType[] = rawHits.map((hit) => ({
    id: Number(hit["$.id"]),
    name: hit["$.name"]!,
    code: hit["$.code"],
    country: hit["$.country"],
    founded: hit["$.founded"] !== null ? Number(hit["$.founded"]) : null,
    national: hit["$.national"] === "true",
    logo: hit["$.logo"],
  }));

  delete fetchedTeamsCache[currentQuerySignature];

  return {
    teams: hits,
    total,
    offset: offset + hits.length,
  };
}
