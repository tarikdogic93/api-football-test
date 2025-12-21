export type SeasonType = {
  year: number;
};

export type SeasonsSkeletonPropsType = {
  pageSize: number;
};

export type SeasonsListProps = {
  seasons: SeasonType[];
};

export type GetSeasonsParamsType = {
  pageSize: number;
  cursor: string | null;
};

export type SeasonsAPIResponse = {
  total: number;
  seasons: SeasonType[];
  nextCursor: string | null;
  hasNextPage: boolean;
};
