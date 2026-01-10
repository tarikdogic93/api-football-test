import { WORLD_DOCUMENT_ID } from "@/lib/constants";
import { CountryType } from "@/features/countries/types";
import Country from "@/features/countries/components/country";

type CountriesListPropsType = {
  countries: CountryType[];
  offset: number;
};

export default function CountriesList({
  countries,
  offset,
}: CountriesListPropsType) {
  return (
    <ul className="divide-y rounded-xl border">
      {countries.map((country, localIndex) => {
        const isFirstInBatch = localIndex === 0;
        const isLastInBatch = localIndex === countries.length - 1;

        return (
          <li key={country.code || WORLD_DOCUMENT_ID}>
            <Country
              name={country.name}
              code={country.code || WORLD_DOCUMENT_ID}
              flag={country.flag}
              index={localIndex + offset}
              isFirstInBatch={isFirstInBatch}
              isLastInBatch={isLastInBatch}
            />
          </li>
        );
      })}
    </ul>
  );
}
