import { SeasonType } from "@/features/seasons/types";
import Season from "@/features/seasons/components/season";

type SeasonsListPropsType = {
  seasons: SeasonType[];
  offset: number;
};

export default function SeasonsList({ seasons, offset }: SeasonsListPropsType) {
  return (
    <ul className="divide-y rounded-xl border">
      {seasons.map((season, localIndex) => (
        <li key={season.year}>
          <Season year={season.year} index={localIndex + offset} />
        </li>
      ))}
    </ul>
  );
}
