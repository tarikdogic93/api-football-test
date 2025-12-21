export type TimezoneType = {
  name: string;
};

export type GetTimezonesParamsType = {
  pageSize: number;
  cursor: string | null;
};

export type TimezonesAPIResponse = {
  total: number;
  timezones: TimezoneType[];
  nextCursor: string | null;
  hasNextPage: boolean;
};
