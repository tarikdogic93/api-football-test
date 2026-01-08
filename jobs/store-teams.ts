import { writeBatch, collection, doc, arrayUnion } from "firebase/firestore";

import { JOB_NAMES, TEAMS_CONSTANTS } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { ensureRedisConnected } from "@/lib/redis";
import { exactKey, getQueryIndexedKey, normalizeString } from "@/lib/utils";
import { registerJob } from "@/lib/job-registry";
import { TeamType } from "@/features/teams/types";

type StoreTeamsPayload = {
  teams: TeamType[];
  timestamp: number;
  querySignature: string;
  leagueQuery?: string;
  seasonQuery?: string;
  venueQuery?: string;
  countryQuery?: string;
  codeQuery?: string;
  searchQuery?: string;
};

async function storeTeams(payload: StoreTeamsPayload): Promise<boolean> {
  const {
    teams,
    timestamp,
    querySignature,
    leagueQuery,
    seasonQuery,
    venueQuery,
    countryQuery,
    codeQuery,
    searchQuery,
  } = payload;

  if (!teams || teams.length === 0) return true;

  const collectionRef = collection(db, TEAMS_CONSTANTS.COLLECTION_PATH);
  const batch = writeBatch(db);

  for (const team of teams) {
    const documentId = String(team.id);
    const docRef = doc(collectionRef, documentId);

    const updatedPayload: Record<string, any> = {
      ...team,
      updatedAt: timestamp,
      nameNormalized: normalizeString(team.name),
    };

    batch.set(docRef, updatedPayload, { merge: true });

    const nestedUpdatedPayload: Record<string, any> = {};

    if (leagueQuery && seasonQuery) {
      nestedUpdatedPayload["queriedValues.leagueSeason"] = arrayUnion({
        league: normalizeString(leagueQuery),
        season: normalizeString(seasonQuery),
      });
    }

    if (venueQuery)
      nestedUpdatedPayload["queriedValues.venue"] = normalizeString(venueQuery);
    if (countryQuery)
      nestedUpdatedPayload["queriedValues.country"] =
        normalizeString(countryQuery);
    if (codeQuery)
      nestedUpdatedPayload["queriedValues.code"] = normalizeString(codeQuery);
    if (searchQuery)
      nestedUpdatedPayload["queriedValues.search"] = arrayUnion(
        normalizeString(searchQuery)
      );

    if (Object.keys(nestedUpdatedPayload).length > 0) {
      batch.update(docRef, nestedUpdatedPayload);
    }
  }

  await batch.commit();

  const redisClient = await ensureRedisConnected();

  const leagueSeasonTag =
    leagueQuery && seasonQuery
      ? `${exactKey(leagueQuery)}_${exactKey(seasonQuery)}`
      : null;

  const initialPipeline = redisClient.multi();

  for (const team of teams) {
    const redisKey = `${TEAMS_CONSTANTS.REDIS_PREFIX}:${team.id}`;

    initialPipeline.json.set(redisKey, "$", {
      ...team,
      id: String(team.id),
      name_exact: exactKey(team.name),
      country_exact: exactKey(team.country),
      code_exact: exactKey(team.code),
      venueId: exactKey(venueQuery),
      name_search: normalizeString(team.name),
      country_search: normalizeString(team.country),
      national: team.national ? "true" : "false",
    });

    if (leagueSeasonTag) {
      initialPipeline.sAdd(`${redisKey}:leagueSeason`, leagueSeasonTag);
    }
  }

  await initialPipeline.exec();

  if (leagueQuery && seasonQuery) {
    const readSetsPipeline = redisClient.multi();

    for (const team of teams) {
      const redisKey = `${TEAMS_CONSTANTS.REDIS_PREFIX}:${team.id}`;
      readSetsPipeline.sMembers(`${redisKey}:leagueSeason`);
    }

    const readSetsResultsRaw = await readSetsPipeline.exec();
    const readSetsResults = readSetsResultsRaw.map(
      (setResult) => setResult as unknown as string[]
    );

    const updateJsonPipeline = redisClient.multi();

    for (let index = 0; index < teams.length; index++) {
      const redisKey = `${TEAMS_CONSTANTS.REDIS_PREFIX}:${teams[index].id}`;
      const allLeagueSeasonTagsForTeam = readSetsResults[index];

      updateJsonPipeline.json.set(
        redisKey,
        "$.leagueSeason",
        allLeagueSeasonTagsForTeam
      );
    }

    await updateJsonPipeline.exec();
  }

  const queryIndexedKey = getQueryIndexedKey(
    TEAMS_CONSTANTS.REDIS_INDEXED_KEY,
    querySignature
  );
  await redisClient.set(queryIndexedKey, timestamp.toString());

  return true;
}

registerJob(JOB_NAMES.STORE_TEAMS, storeTeams);

export default storeTeams;
