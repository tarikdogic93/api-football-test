import { CountryType } from "@/features/countries/types";
import Country from "@/features/countries/components/country";

type CountriesListProps = {
  countries: CountryType[];
};

export default function CountriesList({ countries }: CountriesListProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {countries.map((country) => (
        <Country
          key={country.name}
          name={country.name}
          code={country.code}
          flag={country.flag}
        />
      ))}
    </div>
  );
}
