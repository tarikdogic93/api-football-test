import { VenueType } from "@/features/venues/types";
import Venue from "@/features/venues/components/venue";

type VenuesListProps = { venues: VenueType[] };

export default function VenuesList({ venues }: VenuesListProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {venues.map((venue) => (
        <Venue key={venue.id} venue={venue} />
      ))}
    </div>
  );
}
