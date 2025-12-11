"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function CountriesSkeleton() {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="p-4 shadow rounded flex flex-col items-center gap-1"
        >
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-5 w-10" />
        </div>
      ))}
    </section>
  );
}
