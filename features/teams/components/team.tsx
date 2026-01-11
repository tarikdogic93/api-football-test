import Image from "next/image";
import {
  Calendar1,
  Code,
  Earth,
  Flag,
  ImageIcon,
  ShieldUser,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TeamType } from "@/features/teams/types";

type TeamPropsType = TeamType & {
  index: number;
  isFirstInBatch: boolean;
  isLastInBatch: boolean;
};

export default function Team({
  name,
  code,
  country,
  founded,
  national,
  logo,
  index,
  isFirstInBatch,
  isLastInBatch,
}: TeamPropsType) {
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
        <div className="relative size-10 rounded-full overflow-hidden bg-muted shrink-0 flex items-center justify-center shadow-md">
          {logo ? (
            <Image
              src={logo}
              alt={`${name} logo`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium">{name}</span>
            {code && (
              <Badge variant="secondary">
                <Code className="size-3" />
                {code}
              </Badge>
            )}
            {national && (
              <Badge variant="outline">
                <Flag className="size-3" />
                National
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {country && (
              <div className="flex items-center gap-1">
                <Earth className="size-3" />
                <span className="text-xs text-muted-foreground">{country}</span>
              </div>
            )}
            {founded && (
              <div className="flex items-center gap-1">
                <Calendar1 className="size-3" />
                <span className="text-xs text-muted-foreground">{founded}</span>
              </div>
            )}
          </div>
        </div>
        <ShieldUser className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
