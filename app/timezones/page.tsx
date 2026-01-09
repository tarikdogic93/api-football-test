"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { TimezonesAPIResponse, TimezoneType } from "@/features/timezones/types";
import TimezonesMain from "@/features/timezones/components/timezones-main";

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

        const response = await fetch(`/api/timezones?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch timezones");

        const json: TimezonesAPIResponse = await response.json();

        setTimezones(json.timezones);
        setTotal(json.total);
      } catch {
        setError("Could not load timezones");
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
        title="Timezones"
        icon={Globe}
        loading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        total={total}
      />

      <div className="flex-1 flex flex-col gap-4 justify-between">
        <TimezonesMain
          timezones={timezones}
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
