"use client";

import { useEffect, useState } from "react";

import { TimezoneType } from "@/features/timezones/types";
import TimezonesSkeleton from "@/features/timezones/components/timezones-skeleton";
import TimezonesList from "@/features/timezones/components/timezones-list";

export default function TimezonesPage() {
  const [timezones, setTimezones] = useState<TimezoneType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/timezones`);
        if (!res.ok) throw new Error("Failed to fetch timezones");
        const json = await res.json();
        setTimezones(json as TimezoneType[]);
      } catch (err) {
        setError("Could not load timezones.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="p-6 h-full flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Timezones</h1>

      <div className="flex-1">
        {loading ? (
          <TimezonesSkeleton />
        ) : timezones.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            {error ? (
              <p className="text-destructive">{error}</p>
            ) : (
              <p className="text-muted-foreground">No timezones available.</p>
            )}
          </div>
        ) : (
          <TimezonesList timezones={timezones} />
        )}
      </div>
    </section>
  );
}
