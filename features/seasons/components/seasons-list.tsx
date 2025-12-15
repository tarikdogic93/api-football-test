import { SeasonType } from "@/features/seasons/types";

type SeasonsListProps = {
  seasons: SeasonType[];
};

export default function SeasonsList({ seasons }: SeasonsListProps) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {seasons.map((season) => (
        <li
          key={season}
          className="rounded-md border p-4 text-center font-medium"
        >
          {season}
        </li>
      ))}
    </ul>
  );
}
