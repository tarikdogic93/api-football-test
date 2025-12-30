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
import { CountriesAPIResponse, CountryType } from "@/features/countries/types";
import { searchCountriesSchema } from "@/features/countries/schemas";
import CountriesSkeleton from "@/features/countries/components/countries-skeleton";
import CountriesList from "@/features/countries/components/countries-list";

type SearchFormValues = z.infer<typeof searchCountriesSchema>;

export default function CountriesPage() {
  const [countries, setCountries] = useState<CountryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [queryParams, setQueryParams] = useState<{
    search: string;
    name: string;
    code: string;
  }>({
    search: "",
    name: "",
    code: "",
  });

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchCountriesSchema),
    defaultValues: {
      name: "",
      code: "",
      search: "",
    },
  });

  const handleSearch = (values: SearchFormValues) => {
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

        const res = await fetch(`/api/countries?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch countries");

        const json: CountriesAPIResponse = await res.json();

        setCountries(json.countries);
        setTotal(json.total);
      } catch (err) {
        setError("Could not load country data.");
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

  return (
    <section className="p-6 h-full flex flex-col gap-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSearch)}
          className="flex flex-col md:flex-row gap-4 w-full"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full md:w-1/3">
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="Exact name..."
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      form.setValue("code", "");
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
            name="code"
            render={({ field }) => (
              <FormItem className="w-full md:w-1/3">
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="Exact code..."
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      form.setValue("name", "");
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
              <FormItem className="w-full md:w-1/3">
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="Partial name search..."
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      form.setValue("name", "");
                      form.setValue("code", "");
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
        {countries.length > 0 && (
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
