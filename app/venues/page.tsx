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
import { VenuesAPIResponse, VenueType } from "@/features/venues/types";
import { searchVenuesSchema } from "@/features/venues/schemas";
import VenuesSkeleton from "@/features/venues/components/venues-skeleton";
import VenuesList from "@/features/venues/components/venues-list";

type SearchFormValues = z.infer<typeof searchVenuesSchema>;

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

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchVenuesSchema),
    defaultValues: {
      id: "",
      name: "",
      city: "",
      country: "",
      search: "",
    },
  });

  const handleSearch = (values: SearchFormValues) => {
    setQueryParams({
      id: values.id || "",
      name: values.name || "",
      city: values.city || "",
      country: values.country || "",
      search: values.search || "",
    });
    setCurrentPage(1);
  };

  const isQueryEmpty =
    !queryParams.id &&
    !queryParams.name &&
    !queryParams.city &&
    !queryParams.country &&
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
        if (queryParams.city) params.set("city", queryParams.city);
        if (queryParams.country) params.set("country", queryParams.country);
        if (queryParams.search) params.set("search", queryParams.search);

        const res = await fetch(`/api/venues?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch venues");

        const json: VenuesAPIResponse = await res.json();

        setVenues(json.venues);
        setTotal(json.total ?? 0);
      } catch {
        setError("Could not load venue data.");
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
          className="flex flex-col md:flex-row gap-4 w-full"
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
                    onChange={(e) => {
                      field.onChange(e);
                      form.setValue("name", "");
                      form.setValue("city", "");
                      form.setValue("country", "");
                      form.setValue("search", "");
                      form.trigger();
                    }}
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
                    onChange={(e) => {
                      field.onChange(e);
                      form.setValue("id", "");
                      form.setValue("city", "");
                      form.setValue("country", "");
                      form.setValue("search", "");
                      form.trigger();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem className="w-full md:w-1/5">
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="Exact city..."
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      form.setValue("id", "");
                      form.setValue("name", "");
                      form.setValue("country", "");
                      form.setValue("search", "");
                      form.trigger();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem className="w-full md:w-1/5">
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="Exact country..."
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      form.setValue("id", "");
                      form.setValue("name", "");
                      form.setValue("city", "");
                      form.setValue("search", "");
                      form.trigger();
                    }}
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
                    placeholder="Partial name, city or country search..."
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      form.setValue("id", "");
                      form.setValue("name", "");
                      form.setValue("city", "");
                      form.setValue("country", "");
                      form.trigger();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="cursor-pointer">
            Search
          </Button>
        </form>
      </Form>

      <div className="flex-1 flex flex-col justify-between">
        {isQueryEmpty ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">
              Please use the input fields above to search for venues.
            </p>
          </div>
        ) : loading ? (
          <VenuesSkeleton pageSize={pageSize} />
        ) : venues.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            {error ? (
              <p className="text-destructive">{error}</p>
            ) : (
              <p className="text-muted-foreground">
                No venues were found matching your search.
              </p>
            )}
          </div>
        ) : (
          <VenuesList venues={venues} />
        )}

        {!isQueryEmpty && venues.length > 0 && (
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
