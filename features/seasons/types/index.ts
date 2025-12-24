export type SeasonType = {
  year: number;
};

export type SeasonsSkeletonPropsType = {
  pageSize: number;
};

export type SeasonsListProps = {
  seasons: SeasonType[];
};

export type GetSeasonsParams = {
  pageSize: number;
  offset: number;
};

export type SeasonsAPIResponse = {
  seasons: SeasonType[];
  total: number;
  offset: number;
};
