import { Skeleton } from "@/components/ui/skeleton";

export default function TimezonesSkeleton() {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="p-4 shadow rounded">
          <Skeleton className="h-6 w-full" />
        </div>
      ))}
    </section>
  );
}
