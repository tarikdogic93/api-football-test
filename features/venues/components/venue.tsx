import Image from "next/image";

import { VenueType } from "@/features/venues/types";

type VenuePropsType = VenueType;

export default function Venue({
  name,
  city,
  country,
  capacity,
  surface,
  image,
}: VenuePropsType) {
  return (
    <div className="p-4 shadow rounded flex flex-col items-center text-center gap-1">
      <div className="relative w-28 h-20">
        {image ? (
          <Image
            src={image}
            alt={`${name} image`}
            fill
            className="object-fill rounded-md"
            unoptimized
          />
        ) : (
          <div className="w-28 h-20 bg-accent rounded-md" />
        )}
      </div>
      <p className="font-semibold text-primary truncate max-w-full">{name}</p>
      <p className="text-xs text-accent-foreground">
        <span className="font-semibold">City:</span> {city ?? "—"}
      </p>
      <p className="text-xs text-accent-foreground">
        <span className="font-semibold">Country:</span> {country ?? "—"}
      </p>
      <p className="text-xs text-accent-foreground">
        <span className="font-semibold">Capacity:</span> {capacity ?? "—"}
      </p>
      <p className="text-xs text-accent-foreground">
        <span className="font-semibold">Surface:</span> {surface ?? "—"}
      </p>
    </div>
  );
}
