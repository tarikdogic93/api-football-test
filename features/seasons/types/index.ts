export type SeasonType = {
  year: number;
};

export type SeasonsAPIResponse = {
  seasons: SeasonType[];
  total: number;
  offset: number;
};
