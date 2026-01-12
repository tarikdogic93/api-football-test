"use client";

import { useEffect, useState } from "react";
import { Earth } from "lucide-react";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CollapsibleSearch from "@/components/collapsible-search";
import { CountriesAPIResponse, CountryType } from "@/features/countries/types";
import CountriesSearchForm, {
  CountriesSearchValues,
} from "@/features/countries/components/countries-search-form";
import CountriesMain from "@/features/countries/components/countries-main";

export default function CountriesContent() {
    const [countries, setCountries] = useState<CountryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [queryParams, setQueryParams] = useState({
    search: "",
    name: "",
    code: "",
  });

  const handleSearch = (values: CountriesSearchValues) => {
    setQueryParams({
      name: values.name || "",
      code: values.code || "",
      search: values.search || "",
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        const offset = (currentPage - 1) * pageSize;

        params.set("pageSize", pageSize.toString());
        params.set("offset", offset.toString());

        if (queryParams.name) params.set("name", queryParams.name);
        if (queryParams.code) params.set("code", queryParams.code);
        if (queryParams.search) params.set("search", queryParams.search);

        const response = await fetch(`/api/countries?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch countries");

        const json: CountriesAPIResponse = await response.json();

        setCountries(json.countries);
        setTotal(json.total);
      } catch {
        setError("Could not load countries");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [currentPage, pageSize, queryParams]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  return <section className="p-6 h-full flex flex-col gap-4">
      <Header
        title="Countries"
        icon={Earth}
        loading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        total={total}
      />
      <CollapsibleSearch title="Search countries">
        <CountriesSearchForm onSearch={handleSearch} loading={loading} />
      </CollapsibleSearch>
      <div className="flex-1 flex flex-col gap-4 justify-between">
        <CountriesMain
          countries={countries}
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
}