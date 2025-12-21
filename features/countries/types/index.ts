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

export type GetCountriesParamsType = {
  pageSize: number;
  cursor: string | null;
  nameQuery?: string;
  codeQuery?: string;
  searchQuery?: string;
};

export type CountriesAPIResponse = {
  total: number;
  countries: CountryType[];
  nextCursor: string | null;
  hasNextPage: boolean;
};
