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
import {
  buildQuerySignature,
  exactKey,
  getQueryIndexedKey,
  normalizeString,
} from "@/lib/utils";
import {
  ensureRedisConnected,
  ensureIndexOnce,
  parseRediSearchResults,
} from "@/lib/redis";
import { addBackgroundJob } from "@/lib/queue";
import { fetchFromAPIFootball } from "@/lib/api-football";
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

export function fetchTeamsFromAPI(query: TeamsQueryParams) {
  return fetchFromAPIFootball<TeamType[]>({
    endpoint: TEAMS_CONSTANTS.API_ENDPOINT,
    query: {
      id: query.idQuery,
      name: query.nameQuery,
      league: query.leagueQuery,
      season: query.seasonQuery,
      country: query.countryQuery,
      code: query.codeQuery,
      venue: query.venueQuery,
      search: query.searchQuery,
    },
    transform: (json) => json.response.map((item: any) => item.team),
  });
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
      ["code_exact", "TAG"],
      ["leagueSeason", "TAG"],
      ["venueId", "TAG"],
    ],
  });

  const currentQuerySignature = buildQuerySignature({
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
    } else if (leagueQuery && seasonQuery) {
      const snapshot = await getDocs(
        query(
          TEAMS_COLLECTION,
          where("queriedValues.leagueSeason", "array-contains", {
            league: normalizeString(leagueQuery),
            season: normalizeString(seasonQuery),
          }),
          limit(1)
        )
      );

      isStale =
        snapshot.empty ||
        !snapshot.docs[0].data()?.updatedAt ||
        now - snapshot.docs[0].data().updatedAt > ONE_DAY;
    } else if (venueQuery) {
      const snapshot = await getDocs(
        query(
          TEAMS_COLLECTION,
          where("queriedValues.venue", "==", normalizeString(venueQuery)),
          limit(1)
        )
      );

      isStale =
        snapshot.empty ||
        !snapshot.docs[0].data()?.updatedAt ||
        now - snapshot.docs[0].data().updatedAt > ONE_DAY;
    } else if (countryQuery) {
      const snapshot = await getDocs(
        query(
          TEAMS_COLLECTION,
          where("queriedValues.country", "==", normalizeString(countryQuery)),
          limit(1)
        )
      );

      isStale =
        snapshot.empty ||
        !snapshot.docs[0].data()?.updatedAt ||
        now - snapshot.docs[0].data().updatedAt > ONE_DAY;
    } else if (codeQuery) {
      const snapshot = await getDocs(
        query(
          TEAMS_COLLECTION,
          where("queriedValues.code", "==", normalizeString(codeQuery)),
          limit(1)
        )
      );

      isStale =
        snapshot.empty ||
        !snapshot.docs[0].data()?.updatedAt ||
        now - snapshot.docs[0].data().updatedAt > ONE_DAY;
    } else if (searchQuery) {
      const snapshot = await getDocs(
        query(
          TEAMS_COLLECTION,
          where(
            "queriedValues.search",
            "array-contains",
            normalizeString(searchQuery)
          ),
          limit(1)
        )
      );

      isStale =
        snapshot.empty ||
        !snapshot.docs[0].data()?.updatedAt ||
        now - snapshot.docs[0].data().updatedAt > ONE_DAY;
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
            leagueQuery,
            seasonQuery,
            venueQuery,
            countryQuery,
            codeQuery,
            searchQuery,
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
  if (codeQuery) filters.push(`@code_exact:{${exactKey(codeQuery)}}`);
  if (venueQuery) filters.push(`@venueId:{${exactKey(venueQuery)}}`);

  if (leagueQuery && seasonQuery) {
    filters.push(
      `@leagueSeason:{${exactKey(leagueQuery)}_${exactKey(seasonQuery)}}`
    );
  }

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
    "7",
    "$.id",
    "$.name",
    "$.country",
    "$.code",
    "$.founded",
    "$.national",
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
      "$.founded",
      "$.national",
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
