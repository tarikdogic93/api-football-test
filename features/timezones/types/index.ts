export type TimezoneType = {
  name: string;
};

export type TimezonesAPIResponse = {
  timezones: TimezoneType[];
  total: number;
  offset: number;
};
