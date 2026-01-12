"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from "@/lib/constants";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { SeasonsAPIResponse, SeasonType } from "@/features/seasons/types";
import SeasonsMain from "@/features/seasons/components/seasons-main";

export default function SeasonsContent() {
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
      <Header
        title="Seasons"
        icon={Calendar}
        loading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        total={total}
      />

      <div className="flex-1 flex flex-col gap-4 justify-between">
        <SeasonsMain
          seasons={seasons}
          loading={loading}
          error={error}
          currentPage={currentPage}
          pageSize={pageSize}
        />
        <Footer
          pageSize={pageSize}
          currentPage={currentPage}
          total={total}
          loading={loading}
          onPageChange={goToPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </section>
  );
}
