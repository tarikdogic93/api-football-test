export type CountryType = {
  name: string;
  code: string | null;
  flag: string | null;
};

export type CountriesAPIResponse = {
  countries: CountryType[];
  total: number;
  offset: number;
};
