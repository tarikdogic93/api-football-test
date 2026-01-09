import { Globe } from "lucide-react";

import { ParsedTimezone, TimezoneType } from "@/features/timezones/types";
import { parseTimezone } from "@/features/timezones/helpers";

type TimezoneProps = TimezoneType & {
  index: number;
};

export default function Timezone({ name, index }: TimezoneProps) {
  const { continent, region, city }: ParsedTimezone = parseTimezone(name);

  const displayName = city || region;
  const fullLocation = city && region ? `${continent} / ${region}` : continent;

  return (
    <div className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/30">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-medium">
        {index + 1}
      </div>
      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="flex flex-col flex-1">
          <span className="font-medium text-foreground">{displayName}</span>
          <span className="text-xs text-muted-foreground">{fullLocation}</span>
        </div>
        <Globe className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
