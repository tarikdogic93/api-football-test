"use client";

import { useEffect, useState } from "react";

import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from "@/lib/constants";
import PageSizeSelector from "@/components/page-size-selector";
import MiniPagination from "@/components/mini-pagination";
import { TimezonesAPIResponse, TimezoneType } from "@/features/timezones/types";
import TimezonesSkeleton from "@/features/timezones/components/timezones-skeleton";
import TimezonesList from "@/features/timezones/components/timezones-list";

export default function TimezonesPage() {
  const [timezones, setTimezones] = useState<TimezoneType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const totalPages = Math.ceil(total / pageSize);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const offset = (currentPage - 1) * pageSize;
        const params = new URLSearchParams({
          pageSize: String(pageSize),
          offset: String(offset),
        });

        const res = await fetch(`/api/timezones?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch timezones");

        const json: TimezonesAPIResponse = await res.json();

        setTimezones(json.timezones);
        setTotal(json.total);
      } catch (err) {
        setError("Could not load timezones.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [currentPage, pageSize]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  return (
    <section className="p-6 h-full flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Timezones</h1>

      <div className="flex-1 flex flex-col justify-between">
        {loading ? (
          <TimezonesSkeleton pageSize={pageSize} />
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

        <div className="flex items-center justify-between">
          <PageSizeSelector
            pageSize={pageSize}
            pageSizes={PAGE_SIZES}
            disabled={loading}
            onChange={handlePageSizeChange}
          />
          <div>
            <MiniPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
