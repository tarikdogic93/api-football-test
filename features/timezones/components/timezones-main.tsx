import { TimezoneType } from "@/features/timezones/types";
import TimezonesSkeleton from "@/features/timezones/components/timezones-skeleton";
import TimezonesList from "@/features/timezones/components/timezones-list";

type TimezonesMainPropsType = {
  timezones: TimezoneType[];
  loading: boolean;
  error: string;
  currentPage: number;
  pageSize: number;
};

export default function TimezonesMain({
  timezones,
  loading,
  error,
  currentPage,
  pageSize,
}: TimezonesMainPropsType) {
  const offset = (currentPage - 1) * pageSize;

  if (loading) {
    return <TimezonesSkeleton pageSize={pageSize} />;
  }

  if (timezones.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        {error ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <p className="text-muted-foreground">No timezones were found</p>
        )}
      </div>
    );
  }

  return <TimezonesList timezones={timezones} offset={offset} />;
}
