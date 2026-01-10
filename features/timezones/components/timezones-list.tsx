import { TimezoneType } from "@/features/timezones/types";
import Timezone from "@/features/timezones/components/timezone";

type TimezonesListPropsType = {
  timezones: TimezoneType[];
  offset: number;
};

export default function TimezonesList({
  timezones,
  offset,
}: TimezonesListPropsType) {
  return (
    <ul className="divide-y rounded-xl border">
      {timezones.map((timezone, localIndex) => {
        const isFirstInBatch = localIndex === 0;
        const isLastInBatch = localIndex === timezones.length - 1;

        return (
          <li key={timezone.name}>
            <Timezone
              name={timezone.name}
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
