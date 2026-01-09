import { TimezoneType } from "@/features/timezones/types";
import Timezone from "@/features/timezones/components/timezone";

type TimezonesListProps = {
  timezones: TimezoneType[];
  offset: number;
};

export default function TimezonesList({
  timezones,
  offset,
}: TimezonesListProps) {
  return (
    <ul className="divide-y rounded-xl border">
      {timezones.map((timezone, localIndex) => (
        <li key={timezone.name}>
          <Timezone
            key={timezone.name}
            name={timezone.name}
            index={localIndex + offset}
          />
        </li>
      ))}
    </ul>
  );
}
