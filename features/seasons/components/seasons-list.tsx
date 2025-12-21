import { SeasonsListProps } from "@/features/seasons/types";

export default function SeasonsList({ seasons }: SeasonsListProps) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {seasons.map((season) => (
        <li
          key={season.year}
          className="rounded-md border p-4 text-center font-medium"
        >
          {season.year}
        </li>
      ))}
    </ul>
  );
}
