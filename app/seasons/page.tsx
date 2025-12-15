"use client";

import { useEffect, useState } from "react";

import { SeasonType } from "@/features/seasons/types";
import SeasonsSkeleton from "@/features/seasons/components/seasons-skeleton";
import SeasonsList from "@/features/seasons/components/seasons-list";

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<SeasonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/seasons");
        if (!res.ok) throw new Error("Failed to fetch seasons");

        const json = await res.json();
        setSeasons(json as SeasonType[]);
      } catch (err) {
        setError("Could not load seasons data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="p-6 h-full flex flex-col gap-4">
      <div className="flex-1">
        {loading ? (
          <SeasonsSkeleton />
        ) : seasons.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            {error ? (
              <p className="text-destructive">{error}</p>
            ) : (
              <p className="text-muted-foreground">No seasons were found.</p>
            )}
          </div>
        ) : (
          <SeasonsList seasons={seasons} />
        )}
      </div>
    </section>
  );
}
