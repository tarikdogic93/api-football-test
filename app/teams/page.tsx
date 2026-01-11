"use client";

import { useEffect, useState } from "react";
import { ShieldUser } from "lucide-react";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CollapsibleSearch from "@/components/collapsible-search";
import { TeamsAPIResponse, TeamType } from "@/features/teams/types";
import TeamsSearchForm, {
  TeamsSearchValues,
} from "@/features/teams/components/teams-search-form";
import TeamsMain from "@/features/teams/components/teams-main";

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [queryParams, setQueryParams] = useState({
    id: "",
    name: "",
    league: "",
    season: "",
    country: "",
    code: "",
    venue: "",
    search: "",
  });

  const handleSearch = (values: TeamsSearchValues) => {
    setQueryParams({
      id: values.id || "",
      name: values.name || "",
      league: values.league || "",
      season: values.season || "",
      country: values.country || "",
      code: values.code || "",
      venue: values.venue || "",
      search: values.search || "",
    });
    setCurrentPage(1);
  };

  const areQueriesEmpty =
    !queryParams.id &&
    !queryParams.name &&
    !queryParams.league &&
    !queryParams.season &&
    !queryParams.country &&
    !queryParams.code &&
    !queryParams.venue &&
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
        if (queryParams.league) params.set("league", queryParams.league);
        if (queryParams.season) params.set("season", queryParams.season);
        if (queryParams.country) params.set("country", queryParams.country);
        if (queryParams.code) params.set("code", queryParams.code);
        if (queryParams.venue) params.set("venue", queryParams.venue);
        if (queryParams.search) params.set("search", queryParams.search);

        const response = await fetch(`/api/teams?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch teams");

        const json: TeamsAPIResponse = await response.json();

        setTeams(json.teams);
        setTotal(json.total);
      } catch {
        setError("Could not load teams");
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
        title="Teams"
        icon={ShieldUser}
        loading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        total={total}
      />
      <CollapsibleSearch title="Search teams">
        <TeamsSearchForm onSearch={handleSearch} loading={loading} />
      </CollapsibleSearch>
      <div className="flex-1 flex flex-col gap-4 justify-between">
        <TeamsMain
          teams={teams}
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
