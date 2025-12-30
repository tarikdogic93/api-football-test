import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type TimezonesSkeletonProps = {
  pageSize: number;
};

export default function TimezonesSkeleton({
  pageSize,
}: TimezonesSkeletonProps) {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: pageSize }).map((_, i) => (
        <Card key={i}>
          <CardContent>
            <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
