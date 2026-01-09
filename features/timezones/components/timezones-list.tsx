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
      {timezones.map((timezone, localIndex) => (
        <li key={timezone.name}>
          <Timezone name={timezone.name} index={localIndex + offset} />
        </li>
      ))}
    </ul>
  );
}
