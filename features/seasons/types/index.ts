export type SeasonType = {
  year: number;
};

export type ExtendedSeasonType = SeasonType & {
  updatedAt: number;
};

export type SeasonsAPIResponse = {
  seasons: SeasonType[];
  total: number;
  offset: number;
};
