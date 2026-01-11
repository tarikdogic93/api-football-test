import Image from "next/image";
import Link from "next/link";
import { Building, Code, Earth, ImageIcon, ShieldUser } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CountryType } from "@/features/countries/types";

type CountryPropsType = CountryType & {
  index: number;
  isFirstInBatch: boolean;
  isLastInBatch: boolean;
};

export default function Country({
  name,
  code,
  flag,
  index,
  isFirstInBatch,
  isLastInBatch,
}: CountryPropsType) {
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
        <div className="relative w-15 h-10 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center shadow-md">
          {flag ? (
            <Image
              src={flag}
              alt={`${name} flag`}
              fill
              className="object-cover"
            />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 flex flex-col">
          <span className="font-medium">{name}</span>
          {code && (
            <div className="flex items-center gap-1">
              <Code className="size-3" />
              <span className="text-xs">{code}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/venues?country=${encodeURIComponent(name)}`}>
                  <Building className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>View venues in {name}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/teams?country=${encodeURIComponent(name)}`}>
                  <ShieldUser className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>View teams from {name}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Earth className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
