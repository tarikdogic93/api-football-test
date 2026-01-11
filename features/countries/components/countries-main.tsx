import { CountryType } from "@/features/countries/types";
import CountriesSkeleton from "@/features/countries/components/countries-skeleton";
import CountriesList from "@/features/countries/components/countries-list";

type CountriesMainPropsType = {
  countries: CountryType[];
  loading: boolean;
  error: string;
  currentPage: number;
  pageSize: number;
};

export default function CountriesMain({
  countries,
  loading,
  error,
  currentPage,
  pageSize,
}: CountriesMainPropsType) {
  const offset = (currentPage - 1) * pageSize;

  if (loading) {
    return <CountriesSkeleton pageSize={pageSize} />;
  }

  if (countries.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        {error ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <p className="text-muted-foreground">
            No countries were found matching your search
          </p>
        )}
      </div>
    );
  }

  return <CountriesList countries={countries} offset={offset} />;
}
