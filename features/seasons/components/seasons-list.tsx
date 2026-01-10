import { SeasonType } from "@/features/seasons/types";
import Season from "@/features/seasons/components/season";

type SeasonsListPropsType = {
  seasons: SeasonType[];
  offset: number;
};

export default function SeasonsList({ seasons, offset }: SeasonsListPropsType) {
  return (
    <ul className="divide-y rounded-xl border">
      {seasons.map((season, localIndex) => {
        const isFirstInBatch = localIndex === 0;
        const isLastInBatch = localIndex === seasons.length - 1;

        return (
          <li key={season.year}>
            <Season
              year={season.year}
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
