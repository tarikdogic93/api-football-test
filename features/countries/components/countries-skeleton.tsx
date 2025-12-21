import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CountriesSkeletonProps } from "@/features/countries/types";

export default function CountriesSkeleton({
  pageSize,
}: CountriesSkeletonProps) {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: pageSize }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex flex-col items-center gap-1">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-5 w-10" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
