export type TimezoneType = {
  name: string;
};

export type ParsedTimezone = {
  continent?: string;
  region?: string;
  city?: string;
};

export type TimezonesAPIResponse = {
  timezones: TimezoneType[];
  total: number;
  offset: number;
};
