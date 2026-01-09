export const ONE_DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_PAGE_SIZE = 5;
export const PAGE_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const WORLD_DOCUMENT_ID = "WORLD";

export const API_FOOTBALL_CONSTANTS = {
  HEADER_KEY_NAME: "x-apisports-key",
} as const;

export const JOB_NAMES = {
  STORE_SEASONS: "storeSeasons",
  STORE_COUNTRIES: "storeCountries",
  STORE_TIMEZONES: "storeTimezones",
  STORE_VENUES: "storeVenues",
  STORE_TEAMS: "storeTeams",
} as const;

export const TIMEZONES_CONSTANTS = {
  COLLECTION_PATH: "timezones",
  REDIS_PREFIX: "timezones:",
  REDIS_INDEX: "timezones",
  REDIS_LOCK_KEY: "timezones:fetch-lock",
  REDIS_INDEXED_KEY: "timezones:indexed",
  API_ENDPOINT: "/timezone",
} as const;

export const SEASONS_CONSTANTS = {
  COLLECTION_PATH: "seasons",
  REDIS_PREFIX: "seasons:",
  REDIS_INDEX: "seasons",
  REDIS_LOCK_KEY: "seasons:fetch-lock",
  REDIS_INDEXED_KEY: "seasons:indexed",
  API_ENDPOINT: "/leagues/seasons",
} as const;

export const COUNTRIES_CONSTANTS = {
  COLLECTION_PATH: "countries",
  REDIS_PREFIX: "countries:",
  REDIS_INDEX: "countries",
  REDIS_LOCK_KEY: "countries:fetch-lock",
  REDIS_INDEXED_KEY: "countries:indexed",
  API_ENDPOINT: "/countries",
} as const;

export const VENUES_CONSTANTS = {
  COLLECTION_PATH: "venues",
  REDIS_PREFIX: "venues:",
  REDIS_INDEX: "venues",
  REDIS_LOCK_KEY: "venues:fetch-lock",
  REDIS_INDEXED_KEY: "venues:indexed",
  API_ENDPOINT: "/venues",
} as const;

export const TEAMS_CONSTANTS = {
  COLLECTION_PATH: "teams",
  REDIS_PREFIX: "teams:",
  REDIS_INDEX: "teams",
  REDIS_LOCK_KEY: "teams:fetch-lock",
  REDIS_INDEXED_KEY: "teams:indexed",
  API_ENDPOINT: "/teams",
} as const;
