import { writeBatch, collection, doc, arrayUnion } from "firebase/firestore";

import { JOB_NAMES, TEAMS_CONSTANTS } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { addDocuments, ensureRedisConnected } from "@/lib/redis";
import { exactKey, getQueryIndexedKey, normalizeString } from "@/lib/utils";
import { registerJob } from "@/lib/job-registry";
import { TeamType } from "@/features/teams/types";

type StoreTeamsPayload = {
  teams: TeamType[];
  timestamp: number;
  querySignature: string;
  queryValues: string[];
  leagueQuery?: string;
  seasonQuery?: string;
  venueQuery?: string;
};

async function storeTeams(payload: StoreTeamsPayload): Promise<boolean> {
  const {
    teams,
    timestamp,
    querySignature,
    queryValues,
    leagueQuery,
    seasonQuery,
    venueQuery,
  } = payload;

  if (!teams || teams.length === 0) return true;

  const collectionRef = collection(db, TEAMS_CONSTANTS.COLLECTION_PATH);
  const batch = writeBatch(db);

  const normalizedValues = queryValues.map(normalizeString);

  for (const team of teams) {
    const docRef = doc(collectionRef, String(team.id));

    batch.set(
      docRef,
      {
        ...team,
        updatedAt: timestamp,
        nameNormalized: normalizeString(team.name),
        queriedValues: arrayUnion(...normalizedValues),
        ...(leagueQuery ? { leagueId: leagueQuery } : {}),
        ...(seasonQuery ? { season: seasonQuery } : {}),
        ...(venueQuery ? { venueId: venueQuery } : {}),
      },
      { merge: true }
    );
  }

  await batch.commit();

  await addDocuments(
    TEAMS_CONSTANTS.REDIS_PREFIX,
    teams.map((team) => ({
      id: String(team.id),
      name_exact: exactKey(team.name),
      name_search: normalizeString(team.name),
      country_exact: exactKey(team.country),
      country_search: normalizeString(team.country),
      code: team.code,
      ...(leagueQuery ? { leagueId: leagueQuery } : {}),
      ...(seasonQuery ? { season: seasonQuery } : {}),
      ...(venueQuery ? { venueId: venueQuery } : {}),
      founded: team.founded ? String(team.founded) : null,
      national: team.national ? "true" : "false",
    })),
    "id"
  );

  const redisClient = await ensureRedisConnected();
  const queryIndexedKey = getQueryIndexedKey(
    TEAMS_CONSTANTS.REDIS_INDEXED_KEY,
    querySignature
  );
  await redisClient.set(queryIndexedKey, timestamp.toString());

  return true;
}

registerJob(JOB_NAMES.STORE_TEAMS, storeTeams);

export default storeTeams;
