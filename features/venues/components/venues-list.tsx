import { VenueType } from "@/features/venues/types";
import Venue from "@/features/venues/components/venue";

type VenuesListPropsType = {
  venues: VenueType[];
};

export default function VenuesList({ venues }: VenuesListPropsType) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {venues.map((venue) => (
        <Venue
          key={venue.id}
          id={venue.id}
          name={venue.name}
          address={venue.address}
          city={venue.city}
          country={venue.country}
          capacity={venue.capacity}
          surface={venue.surface}
          image={venue.image}
        />
      ))}
    </div>
  );
}
