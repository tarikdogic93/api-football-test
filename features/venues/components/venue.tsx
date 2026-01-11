import Link from "next/link";
import Image from "next/image";
import {
  Building,
  Building2,
  Earth,
  ImageIcon,
  Layers,
  MapPin,
  ShieldUser,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VenueType } from "@/features/venues/types";

type VenuePropsType = VenueType & {
  index: number;
  isFirstInBatch: boolean;
  isLastInBatch: boolean;
};

export default function Venue({
  name,
  address,
  city,
  country,
  capacity,
  surface,
  image,
  index,
  isFirstInBatch,
  isLastInBatch,
}: VenuePropsType) {
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
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <div className="relative w-15 h-10 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center shadow-md">
              {image ? (
                <Image
                  src={image}
                  alt={`${name} image`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <ImageIcon className="size-5 text-muted-foreground" />
              )}
            </div>
          </HoverCardTrigger>
          <HoverCardContent side="right" className="p-0 w-52">
            <div className="relative w-full h-32 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center shadow-md">
              {image ? (
                <Image
                  src={image}
                  alt={`${name} image`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <ImageIcon className="size-6 text-muted-foreground" />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-2">
                <p className="text-white font-semibold text-sm truncate">
                  {name}
                </p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium">{name}</span>
            {surface && (
              <Badge variant="secondary">
                <Layers className="size-3" />
                {surface}
              </Badge>
            )}
            {capacity && (
              <Badge variant="outline">
                <Users className="size-3" />
                {capacity.toLocaleString()}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {address && (
              <div className="flex items-center gap-1">
                <MapPin className="size-3" />
                <span className="text-xs text-muted-foreground">{address}</span>
              </div>
            )}
            {city && (
              <div className="flex items-center gap-1">
                <Building2 className="size-3" />
                <span className="text-xs text-muted-foreground">{city}</span>
              </div>
            )}
            {country && (
              <div className="flex items-center gap-1">
                <Earth className="size-3" />
                <span className="text-xs text-muted-foreground">{country}</span>
              </div>
            )}
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/teams?venue=${encodeURIComponent(name)}`}>
                  <ShieldUser className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>View teams at {name}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Building className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
