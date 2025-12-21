"use client";

import { useEffect, useRef, useState } from "react";

import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageSizeSelector from "@/components/page-size-selector";
import MiniPagination from "@/components/mini-pagination";
import { CountriesAPIResponse, CountryType } from "@/features/countries/types";
import CountriesSkeleton from "@/features/countries/components/countries-skeleton";
import CountriesList from "@/features/countries/components/countries-list";

export default function CountriesPage() {
  const [countries, setCountries] = useState<CountryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const cursors = useRef<{ [key: number]: string | null }>({ 1: null });

  const [queryParams, setQueryParams] = useState<{
    search: string;
    name: string;
    code: string;
  }>({
    search: "",
    name: "",
    code: "",
  });

  const handleSearch = () => {
    setQueryParams({ search, name, code });
    setCurrentPage(1);
    cursors.current = { 1: null };
  };

  const isExactQuery = !!queryParams.name || !!queryParams.code;
  const totalPages = isExactQuery ? 1 : Math.ceil(total / pageSize);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const cursor = cursors.current[currentPage] ?? null;
        const params = new URLSearchParams();

        if (!isExactQuery) {
          params.set("pageSize", String(pageSize));
          if (cursor) params.set("cursor", cursor);
        }

        if (queryParams.name) params.set("name", queryParams.name);
        if (queryParams.code) params.set("code", queryParams.code);
        if (queryParams.search) params.set("search", queryParams.search);

        const res = await fetch(`/api/countries?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch countries");

        const json: CountriesAPIResponse = await res.json();

        setCountries(json.countries);
        setTotal(json.total);

        if (!isExactQuery && json.hasNextPage) {
          cursors.current[currentPage + 1] = json.nextCursor;
        }
      } catch (err) {
        setError("Could not load country data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [currentPage, pageSize, queryParams, isExactQuery]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(1);
    cursors.current = { 1: null };
  };

  return (
    <section className="p-6 h-full flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <Input
          id="name"
          type="text"
          placeholder="Exact name..."
          value={name}
          autoComplete="off"
          onChange={(e) => {
            setName(e.target.value);
            setSearch("");
            setCode("");
          }}
          className="w-full md:w-1/3"
        />
        <Input
          id="code"
          type="text"
          placeholder="Exact code..."
          value={code}
          autoComplete="off"
          onChange={(e) => {
            setCode(e.target.value);
            setSearch("");
            setName("");
          }}
          className="w-full md:w-1/3"
        />
        <Input
          id="search"
          type="text"
          placeholder="Partial name search..."
          value={search}
          autoComplete="off"
          onChange={(e) => {
            setSearch(e.target.value);
            setName("");
            setCode("");
          }}
          className="w-full md:w-1/3"
        />
        <Button className="cursor-pointer" onClick={handleSearch}>
          Search
        </Button>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        {loading ? (
          <CountriesSkeleton pageSize={pageSize} />
        ) : countries.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            {error ? (
              <p className="text-destructive">{error}</p>
            ) : (
              <p className="text-muted-foreground">
                No countries were found matching your search.
              </p>
            )}
          </div>
        ) : (
          <CountriesList countries={countries} />
        )}

        <div className="flex items-center justify-between mt-4">
          <PageSizeSelector
            pageSize={pageSize}
            pageSizes={PAGE_SIZES}
            disabled={isExactQuery || loading}
            onChange={handlePageSizeChange}
          />
          <div>
            <MiniPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              disabled={isExactQuery || loading}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
