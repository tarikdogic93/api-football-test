import { Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type TimezonesHeaderProps = {
  loading: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
};

export default function TimezonesHeader({
  loading,
  currentPage,
  pageSize,
  total,
}: TimezonesHeaderProps) {
  return (
    <header>
      <div className="flex items-center gap-3">
        <Globe />
        <h1 className="text-2xl font-bold">Timezones</h1>
      </div>

      {loading ? (
        <Skeleton className="h-5 w-24" />
      ) : (
        total > 0 && (
          <p className="text-sm text-muted-foreground">
            {(currentPage - 1) * pageSize + 1}&#45;
            {Math.min(currentPage * pageSize, total)} of {total}
          </p>
        )
      )}
    </header>
  );
}
