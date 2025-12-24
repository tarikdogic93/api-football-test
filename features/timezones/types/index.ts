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
  offset: number;
};

export type TimezonesAPIResponse = {
  timezones: TimezoneType[];
  total: number;
  offset: number;
};
