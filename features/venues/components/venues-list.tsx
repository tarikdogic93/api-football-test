import { VenueType } from "@/features/venues/types";
import Venue from "@/features/venues/components/venue";

type VenuesListPropsType = {
  venues: VenueType[];
  offset: number;
};

export default function VenuesList({ venues, offset }: VenuesListPropsType) {
  return (
    <ul className="divide-y rounded-xl border">
      {venues.map((venue, localIndex) => {
        const isFirstInBatch = localIndex === 0;
        const isLastInBatch = localIndex === venues.length - 1;

        return (
          <li key={venue.id}>
            <Venue
              id={venue.id}
              name={venue.name}
              address={venue.address}
              city={venue.city}
              country={venue.country}
              capacity={venue.capacity}
              surface={venue.surface}
              image={venue.image}
              index={localIndex + offset}
              isFirstInBatch={isFirstInBatch}
              isLastInBatch={isLastInBatch}
            />
          </li>
        );
      })}
    </ul>
  );
}
