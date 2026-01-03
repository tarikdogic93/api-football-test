export type CountryType = {
  name: string;
  code: string | null;
  flag: string | null;
};

export type ExtendedCountryType = CountryType & {
  updatedAt: number;
};

export type CountriesAPIResponse = {
  countries: CountryType[];
  total: number;
  offset: number;
};
