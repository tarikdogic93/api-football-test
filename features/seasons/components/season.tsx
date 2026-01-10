import { Calendar } from "lucide-react";

import { SeasonType } from "@/features/seasons/types";

type SeasonPropsType = SeasonType & {
  index: number;
};

export default function Season({ year, index }: SeasonPropsType) {
  return (
    <div className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/30">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-medium">
        {index + 1}
      </div>
      <div className="flex flex-1 items-center justify-between gap-4">
        <span className="font-medium">{year}</span>
        <Calendar className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
