import { CountryType } from "@/features/countries/types";
import Country from "@/features/countries/components/country";

type CountriesListPropsType = {
  countries: CountryType[];
};

export default function CountriesList({ countries }: CountriesListPropsType) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {countries.map((country) => (
        <Country
          key={country.code}
          name={country.name}
          code={country.code}
          flag={country.flag}
        />
      ))}
    </div>
  );
}
