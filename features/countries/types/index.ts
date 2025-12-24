export type CountryType = {
  name: string;
  code: string | null;
  flag: string | null;
};

export type CountriesSkeletonProps = {
  pageSize: number;
};

export type CountriesListProps = {
  countries: CountryType[];
};

export type CountryProps = CountryType;

export type GetCountriesParams = {
  pageSize: number;
  offset: number;
  nameQuery?: string;
  codeQuery?: string;
  searchQuery?: string;
};

export type CountriesAPIResponse = {
  countries: CountryType[];
  total: number;
  offset: number;
};
