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
    <section className="p-6">
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {loading ? <SeasonsSkeleton /> : <SeasonsList seasons={seasons} />}
    </section>
  );
}
