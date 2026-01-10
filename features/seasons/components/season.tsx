import { Calendar } from "lucide-react";

import { cn } from "@/lib/utils";
import { SeasonType } from "@/features/seasons/types";

type SeasonPropsType = SeasonType & {
  index: number;
  isFirstInBatch: boolean;
  isLastInBatch: boolean;
};

export default function Season({
  year,
  index,
  isFirstInBatch,
  isLastInBatch,
}: SeasonPropsType) {
  return (
    <div
      className={cn(
        "group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/30",
        {
          "rounded-t-xl": isFirstInBatch,
          "rounded-b-xl": isLastInBatch,
        }
      )}
    >
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
