"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { VenueType } from "@/features/venues/types";
import VenuesSkeleton from "@/features/venues/components/venues-skeleton";
import VenuesList from "@/features/venues/components/venues-list";

export default function VenuesPage() {
  const [venues, setVenues] = useState<VenueType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const [debouncedQuery, setDebouncedQuery] = useState<{
    search: string;
    id: string;
    name: string;
    city: string;
    country: string;
  } | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery({ search, id, name, city, country });
    }, 1000);
    return () => clearTimeout(handler);
  }, [search, id, name, city, country]);

  useEffect(() => {
    if (!debouncedQuery) return;

    const { search, id, name, city, country } = debouncedQuery;
    if (!search && !id && !name && !city && !country) {
      setVenues([]);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError("");

      try {
        const params: string[] = [];
        if (id) params.push(`id=${id}`);
        if (name) params.push(`name=${name}`);
        if (city) params.push(`city=${city}`);
        if (country) params.push(`country=${country}`);
        if (search) params.push(`search=${search}`);

        const res = await fetch(`/api/venues?${params.join("&")}`);
        if (!res.ok) throw new Error("Failed to fetch venues");

        const json = await res.json();
        setVenues(json as VenueType[]);
      } catch (err) {
        setError("Could not load venue data.");
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
          id="id"
          placeholder="ID"
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setSearch("");
            setName("");
            setCity("");
            setCountry("");
          }}
          className="w-full md:w-1/5"
        />
        <Input
          id="name"
          placeholder="Exact name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSearch("");
            setId("");
            setCity("");
            setCountry("");
          }}
          className="w-full md:w-1/5"
        />
        <Input
          id="city"
          placeholder="City"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setSearch("");
            setId("");
            setName("");
            setCountry("");
          }}
          className="w-full md:w-1/5"
        />
        <Input
          id="country"
          placeholder="Country"
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setSearch("");
            setId("");
            setName("");
            setCity("");
          }}
          className="w-full md:w-1/5"
        />
        <Input
          id="search"
          placeholder="Fuzzy search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setId("");
            setName("");
            setCity("");
            setCountry("");
          }}
          className="w-full md:w-1/5"
        />
      </div>
      <div className="flex-1">
        {loading ? (
          <VenuesSkeleton />
        ) : venues.length > 0 ? (
          <VenuesList venues={venues} />
        ) : (
          <div className="h-full flex items-center justify-center">
            {!debouncedQuery ||
            (!debouncedQuery.id &&
              !debouncedQuery.name &&
              !debouncedQuery.city &&
              !debouncedQuery.country &&
              !debouncedQuery.search) ? (
              <p className="text-muted-foreground">
                Please use the input fields above to search for venues.
              </p>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : (
              <p className="text-muted-foreground">
                No venues were found matching your search.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
