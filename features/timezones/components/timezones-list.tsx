import { TimezoneType } from "@/features/timezones/types";
import Timezone from "@/features/timezones/components/timezone";

type TimezonesListProps = {
  timezones: TimezoneType[];
};

export default function TimezonesList({ timezones }: TimezonesListProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {timezones.map((tz) => (
        <Timezone key={tz.name} name={tz.name} />
      ))}
    </div>
  );
}
