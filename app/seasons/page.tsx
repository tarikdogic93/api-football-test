"use client";

import { useEffect, useState } from "react";

import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from "@/lib/constants";
import PageSizeSelector from "@/components/page-size-selector";
import MiniPagination from "@/components/mini-pagination";
import { SeasonsAPIResponse, SeasonType } from "@/features/seasons/types";
import SeasonsSkeleton from "@/features/seasons/components/seasons-skeleton";
import SeasonsList from "@/features/seasons/components/seasons-list";

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<SeasonType[]>([]);
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

        const response = await fetch(`/api/seasons?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch seasons");

        const json: SeasonsAPIResponse = await response.json();

        setSeasons(json.seasons);
        setTotal(json.total);
      } catch {
        setError("Could not load seasons");
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
      <h1 className="text-2xl font-bold">Seasons</h1>

      <div className="flex-1 flex flex-col justify-between">
        {loading ? (
          <SeasonsSkeleton pageSize={pageSize} />
        ) : seasons.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            {error ? (
              <p className="text-destructive">{error}</p>
            ) : (
              <p className="text-muted-foreground">No seasons were found</p>
            )}
          </div>
        ) : (
          <SeasonsList seasons={seasons} />
        )}
        {seasons.length > 0 && (
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
        )}
      </div>
    </section>
  );
}
