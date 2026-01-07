"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CountriesAPIResponse, CountryType } from "@/features/countries/types";
import { searchCountriesSchema } from "@/features/countries/schemas";

type CountriesComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isInvalid?: boolean;
};

export default function CountriesCombobox({
  value,
  onChange,
  disabled,
  isInvalid,
}: CountriesComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [countriesList, setCountriesList] = useState<CountryType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCountries, setTotalCountries] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<CountryType | null>(
    null
  );
  const [error, setError] = useState("");

  const listContainerRef = useRef<HTMLDivElement>(null);
  const hasSearchedRef = useRef(false);
  const countryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasScrolledToSelectedCountryRef = useRef(false);
  const shouldAutoLoadRef = useRef(false);

  const fetchCountries = async (reset = false) => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    const queryParams = new URLSearchParams();
    queryParams.set("pageSize", DEFAULT_PAGE_SIZE.toString());
    queryParams.set("offset", reset ? "0" : currentOffset.toString());
    if (searchTerm) queryParams.set("search", searchTerm);

    try {
      const response = await fetch(`/api/countries?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch countries");
      const data: CountriesAPIResponse = await response.json();

      const countries = data.countries || [];

      if (reset) {
        setCountriesList(countries);
        setCurrentOffset(data.offset || 0);
      } else {
        setCountriesList((prevCountries) => [...prevCountries, ...countries]);
        setCurrentOffset(data.offset || currentOffset);
      }

      setTotalCountries(data.total || 0);
    } catch {
      setError("Could not load countries");
      if (reset) setCountriesList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (
      !searchTerm &&
      value &&
      !isLoading &&
      countriesList.length > 0 &&
      countriesList.length < totalCountries &&
      (shouldAutoLoadRef.current || !selectedCountry)
    ) {
      const match = countriesList.find((country) => country.name === value);

      if (!match) {
        fetchCountries();
      } else {
        shouldAutoLoadRef.current = false;
      }
    }
  }, [
    searchTerm,
    value,
    selectedCountry,
    isLoading,
    countriesList,
    totalCountries,
  ]);

  useEffect(() => {
    if (isOpen && countriesList.length === 0 && !hasSearchedRef.current) {
      if (searchTerm) {
        const validation = searchCountriesSchema.safeParse({
          search: searchTerm,
        });

        if (validation.success) {
          fetchCountries(true);
        }
      } else {
        fetchCountries(true);
      }
    }

    if (isOpen && selectedCountry && !hasScrolledToSelectedCountryRef.current) {
      requestAnimationFrame(() => {
        const selectedCountryElement =
          countryRefs.current[selectedCountry.name];
        const listContainerElement = listContainerRef.current;

        if (selectedCountryElement && listContainerElement) {
          const selectedCountryTop = selectedCountryElement.offsetTop;
          const selectedCountryBottom =
            selectedCountryTop + selectedCountryElement.offsetHeight;

          if (
            selectedCountryTop < listContainerElement.scrollTop ||
            selectedCountryBottom >
              listContainerElement.scrollTop + listContainerElement.clientHeight
          ) {
            listContainerElement.scrollTo({
              top:
                selectedCountryTop -
                listContainerElement.clientHeight / 2 +
                selectedCountryElement.offsetHeight / 2,
              behavior: "smooth",
            });
          }

          hasScrolledToSelectedCountryRef.current = true;
        }
      });
    }

    if (!isOpen) {
      hasSearchedRef.current = false;
      hasScrolledToSelectedCountryRef.current = false;
      shouldAutoLoadRef.current = false;
    }
  }, [isOpen, selectedCountry, countriesList, searchTerm]);

  const handleScroll = () => {
    const container = listContainerRef.current;
    if (!container || isLoading) return;

    if (searchTerm) {
      const validation = searchCountriesSchema.safeParse({
        search: searchTerm,
      });
      if (!validation.success) return;
    }

    const threshold = 8;

    if (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - threshold
    ) {
      if (countriesList.length < totalCountries) {
        fetchCountries();
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const debounce = setTimeout(() => {
      if (!searchTerm && hasSearchedRef.current) {
        if (value) {
          shouldAutoLoadRef.current = true;
          hasScrolledToSelectedCountryRef.current = false;
        }
        fetchCountries(true);
        return;
      }

      if (!searchTerm) return;

      hasSearchedRef.current = true;

      const validation = searchCountriesSchema.safeParse({
        search: searchTerm,
      });

      if (validation.success) {
        fetchCountries(true);
      } else {
        setCountriesList([]);
        setTotalCountries(0);
        setCurrentOffset(0);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, isOpen]);

  useEffect(() => {
    if (!value) {
      setSelectedCountry(null);
      return;
    }

    if (selectedCountry?.name === value) return;

    const match = countriesList.find((country) => country.name === value);
    if (match) {
      setSelectedCountry(match);
    }
  }, [value, countriesList, selectedCountry]);

  const isInitialLoading = isLoading && countriesList.length === 0;
  const isLoadingMore = isLoading && countriesList.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-invalid={isInvalid}
          className="min-w-0 bg-background hover:bg-background border-input justify-between px-3 font-normal"
        >
          <div className="flex items-center gap-2 min-w-0">
            {value ? (
              <>
                {selectedCountry?.flag && (
                  <div className="relative w-5 h-4 shrink-0">
                    <Image
                      src={selectedCountry.flag}
                      alt={`${value} flag`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <span className="truncate">{value}</span>
              </>
            ) : (
              <span className="text-muted-foreground truncate">
                Select country
              </span>
            )}
          </div>
          <ChevronDown className="text-muted-foreground/80 shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="border-input w-(--radix-popper-anchor-width) p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search countries..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />

          <CommandList
            ref={listContainerRef}
            onScroll={handleScroll}
            className="max-h-60 overflow-y-auto"
          >
            {isInitialLoading && (
              <div className="px-2 py-1.5 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            )}

            {error && !isLoading && (
              <div className="px-2 py-1.5 text-center text-sm text-destructive">
                {error}
              </div>
            )}

            {!isLoading && !error && countriesList.length === 0 && (
              <CommandEmpty className="px-2 py-1.5">
                No countries found
              </CommandEmpty>
            )}

            {countriesList.map((country) => (
              <CommandItem
                key={`${country.code}-${country.name}`}
                value={country.name}
                ref={(element) => {
                  countryRefs.current[country.name] = element;
                }}
                onSelect={(selectedValue) => {
                  if (value === selectedValue) {
                    onChange("");
                    setSelectedCountry(null);
                    setSearchTerm("");
                  } else {
                    onChange(selectedValue);
                    setSelectedCountry(country);
                  }
                  setIsOpen(false);
                }}
              >
                {country.flag && (
                  <div className="relative w-5 h-4 mr-2 shrink-0">
                    <Image
                      src={country.flag}
                      alt={`${country.name} flag`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <span className="truncate">{country.name}</span>
                {value === country.name && (
                  <Check className="size-4 ml-auto shrink-0" />
                )}
              </CommandItem>
            ))}

            {isLoadingMore && (
              <div className="px-2 py-1.5 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
