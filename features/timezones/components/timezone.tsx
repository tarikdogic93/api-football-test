import { TimezoneType } from "@/features/timezones/types";

type TimezoneProps = TimezoneType;

export default function Timezone({ name }: TimezoneProps) {
  return (
    <div className="p-4 shadow rounded">
      <p className="font-semibold text-primary text-center truncate max-w-full">
        {name}
      </p>
    </div>
  );
}
