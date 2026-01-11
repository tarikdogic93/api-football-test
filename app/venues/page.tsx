"use client";

import { useEffect, useState } from "react";
import { Building } from "lucide-react";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CollapsibleSearch from "@/components/collapsible-search";
import { VenuesAPIResponse, VenueType } from "@/features/venues/types";
import VenuesSearchForm, {
  VenuesSearchValues,
} from "@/features/venues/components/venues-search-form";
import VenuesMain from "@/features/venues/components/venues-main";

export default function VenuesPage() {
  const [venues, setVenues] = useState<VenueType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [queryParams, setQueryParams] = useState({
    id: "",
    name: "",
    city: "",
    country: "",
    search: "",
  });

  const handleSearch = (values: VenuesSearchValues) => {
    setQueryParams({
      id: values.id || "",
      name: values.name || "",
      city: values.city || "",
      country: values.country || "",
      search: values.search || "",
    });
    setCurrentPage(1);
  };

  const areQueriesEmpty =
    !queryParams.id &&
    !queryParams.name &&
    !queryParams.city &&
    !queryParams.country &&
    !queryParams.search;

  const totalPages = Math.ceil(total / pageSize);

  useEffect(() => {
    if (areQueriesEmpty) return;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        const offset = (currentPage - 1) * pageSize;

        params.set("pageSize", String(pageSize));
        params.set("offset", String(offset));

        if (queryParams.id) params.set("id", queryParams.id);
        if (queryParams.name) params.set("name", queryParams.name);
        if (queryParams.city) params.set("city", queryParams.city);
        if (queryParams.country) params.set("country", queryParams.country);
        if (queryParams.search) params.set("search", queryParams.search);

        const response = await fetch(`/api/venues?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch venues");

        const json: VenuesAPIResponse = await response.json();

        setVenues(json.venues);
        setTotal(json.total);
      } catch {
        setError("Could not load venues");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [currentPage, pageSize, queryParams, areQueriesEmpty]);

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
        title="Venues"
        icon={Building}
        loading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        total={total}
      />
      <CollapsibleSearch title="Search venues">
        <VenuesSearchForm onSearch={handleSearch} loading={loading} />
      </CollapsibleSearch>
      <div className="flex-1 flex flex-col gap-4 justify-between">
        <VenuesMain
          venues={venues}
          loading={loading}
          error={error}
          currentPage={currentPage}
          pageSize={pageSize}
          areQueriesEmpty={areQueriesEmpty}
        />
        {!areQueriesEmpty && (
          <Footer
            pageSize={pageSize}
            currentPage={currentPage}
            total={total}
            loading={loading}
            onPageChange={goToPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>
    </section>
  );
}
