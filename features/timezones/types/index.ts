export type TimezoneType = {
  name: string;
};

export type TimezonesSkeletonProps = {
  pageSize: number;
};

export type TimezonesListProps = {
  timezones: TimezoneType[];
};

export type TimezoneProps = TimezoneType;

export type GetTimezonesParams = {
  pageSize: number;
  cursor: string | null;
};

export type TimezonesAPIResponse = {
  total: number;
  timezones: TimezoneType[];
  nextCursor: string | null;
  hasNextPage: boolean;
};
