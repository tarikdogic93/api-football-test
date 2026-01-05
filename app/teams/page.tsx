"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import PageSizeSelector from "@/components/page-size-selector";
import MiniPagination from "@/components/mini-pagination";
import { TeamsAPIResponse, TeamType } from "@/features/teams/types";
import { searchTeamsSchema } from "@/features/teams/schemas";
import TeamsSkeleton from "@/features/teams/components/teams-skeleton";
import TeamsList from "@/features/teams/components/teams-list";
import CountriesCombobox from "@/components/countries-combobox";

type SearchFormValues = z.infer<typeof searchTeamsSchema>;

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

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchTeamsSchema),
    defaultValues: {
      id: "",
      name: "",
      league: "",
      season: "",
      country: "",
      code: "",
      venue: "",
      search: "",
    },
  });

  const handleSearch = (values: SearchFormValues) => {
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

  const isQueryEmpty =
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
    if (isQueryEmpty) return;

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
        setTotal(json.total ?? 0);
      } catch {
        setError("Could not load teams");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [currentPage, pageSize, queryParams, isQueryEmpty]);

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
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSearch)}
          className="flex flex-col md:flex-row md:flex-wrap gap-4 w-full"
        >
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem className="w-full md:w-1/5">
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="ID..."
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full md:w-1/5">
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="Exact name..."
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="league"
            render={({ field }) => (
              <FormItem className="w-full md:w-1/5">
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="League ID..."
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="season"
            render={({ field }) => (
              <FormItem className="w-full md:w-1/5">
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="Season..."
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field, fieldState }) => (
              <FormItem className="w-full md:w-1/5">
                <FormControl>
                  <CountriesCombobox
                    value={field.value || ""}
                    onChange={(value) => field.onChange(value)}
                    disabled={loading}
                    isInvalid={!!fieldState.error}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="w-full md:w-1/5">
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="Team code..."
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venue"
            render={({ field }) => (
              <FormItem className="w-full md:w-1/5">
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="Venue ID..."
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="search"
            render={({ field }) => (
              <FormItem className="w-full md:w-1/5">
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="Partial name or country..."
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="cursor-pointer" disabled={loading}>
            Search
          </Button>
        </form>
      </Form>

      <div className="flex-1 flex flex-col justify-between">
        {isQueryEmpty ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">
              Please use the input fields above to search for teams
            </p>
          </div>
        ) : loading ? (
          <TeamsSkeleton pageSize={pageSize} />
        ) : teams.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            {error ? (
              <p className="text-destructive">{error}</p>
            ) : (
              <p className="text-muted-foreground">
                No teams were found matching your search
              </p>
            )}
          </div>
        ) : (
          <TeamsList teams={teams} />
        )}

        {!isQueryEmpty && teams.length > 0 && (
          <div className="flex items-center justify-between mt-4">
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
