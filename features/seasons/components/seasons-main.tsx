import { SeasonType } from "@/features/seasons/types";
import SeasonsSkeleton from "@/features/seasons/components/seasons-skeleton";
import SeasonsList from "@/features/seasons/components/seasons-list";

type SeasonsMainPropsType = {
  seasons: SeasonType[];
  loading: boolean;
  error: string;
  currentPage: number;
  pageSize: number;
};

export default function SeasonsMain({
  seasons,
  loading,
  error,
  currentPage,
  pageSize,
}: SeasonsMainPropsType) {
  const offset = (currentPage - 1) * pageSize;

  if (loading) {
    return <SeasonsSkeleton pageSize={pageSize} />;
  }

  if (seasons.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        {error ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <p className="text-muted-foreground">No seasons were found</p>
        )}
      </div>
    );
  }

  return <SeasonsList seasons={seasons} offset={offset} />;
}
