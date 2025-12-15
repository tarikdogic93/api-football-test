"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { CountryType } from "@/features/countries/types";
import CountriesSkeleton from "@/features/countries/components/countries-skeleton";
import CountriesList from "@/features/countries/components/countries-list";

export default function CountriesPage() {
  const [countries, setCountries] = useState<CountryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const [debouncedQuery, setDebouncedQuery] = useState<{
    search: string;
    name: string;
    code: string;
  } | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery({ search, name, code });
    }, 1000);
    return () => clearTimeout(handler);
  }, [search, name, code]);

  useEffect(() => {
    if (!debouncedQuery) return;

    async function load() {
      setLoading(true);
      try {
        let queryString = "";

        if (debouncedQuery?.name) queryString = `?name=${debouncedQuery.name}`;
        else if (debouncedQuery?.code)
          queryString = `?code=${debouncedQuery.code}`;
        else if (debouncedQuery?.search)
          queryString = `?search=${debouncedQuery.search}`;

        const res = await fetch(`/api/countries${queryString}`);
        if (!res.ok) throw new Error("Failed to fetch countries");
        const json = await res.json();
        setCountries(json as CountryType[]);
      } catch (err) {
        setError("Could not load country data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [debouncedQuery]);

  return (
    <section className="p-6 h-full flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <Input
          id="search"
          type="text"
          placeholder="Fuzzy search..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setName("");
            setCode("");
          }}
          className="w-full md:w-1/3"
        />
        <Input
          id="name"
          type="text"
          placeholder="Exact name..."
          value={name}
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
          onChange={(e) => {
            setCode(e.target.value);
            setSearch("");
            setName("");
          }}
          className="w-full md:w-1/3"
        />
      </div>
      <div className="flex-1">
        {loading ? (
          <CountriesSkeleton />
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
      </div>
    </section>
  );
}
