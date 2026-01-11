import { VenueType } from "@/features/venues/types";
import VenuesSkeleton from "@/features/venues/components/venues-skeleton";
import VenuesList from "@/features/venues/components/venues-list";

type VenuesMainPropsType = {
  venues: VenueType[];
  loading: boolean;
  error: string;
  currentPage: number;
  pageSize: number;
  areQueriesEmpty?: boolean;
};

export default function VenuesMain({
  venues,
  loading,
  error,
  currentPage,
  pageSize,
  areQueriesEmpty = false,
}: VenuesMainPropsType) {
  const offset = (currentPage - 1) * pageSize;

  if (loading) {
    return <VenuesSkeleton pageSize={pageSize} />;
  }

  if (areQueriesEmpty) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">
          Please use the input fields above to search for venues
        </p>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        {error ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <p className="text-muted-foreground">
            No venues were found matching your search
          </p>
        )}
      </div>
    );
  }

  return <VenuesList venues={venues} offset={offset} />;
}
