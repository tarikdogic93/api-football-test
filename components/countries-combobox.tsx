"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

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

type CountriesComboboxPropsType = {
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
}: CountriesComboboxPropsType) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [countriesList, setCountriesList] = useState<CountryType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCountries, setTotalCountries] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<CountryType | null>(
    null
  );
  const [error, setError] = useState("");

  const listContainerRef = useRef<HTMLDivElement>(null);
  const countryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasScrolledToSelectedCountryRef = useRef(false);
  const shouldAutoLoadRef = useRef(false);

  const fetchCountries = async (reset = false, searchQuery = "") => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    const queryParams = new URLSearchParams();
    queryParams.set("pageSize", DEFAULT_PAGE_SIZE.toString());
    queryParams.set("offset", reset ? "0" : currentOffset.toString());
    if (searchQuery) queryParams.set("search", searchQuery);

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

  const handleSearchClick = () => {
    if (!searchTerm) {
      if (value) {
        shouldAutoLoadRef.current = true;
        hasScrolledToSelectedCountryRef.current = false;
      }
      setAppliedSearchTerm("");
      setCountriesList([]);
      fetchCountries(true, "");
      return;
    }

    const validation = searchCountriesSchema.safeParse({
      search: searchTerm,
    });

    if (validation.success) {
      setAppliedSearchTerm(searchTerm);
      fetchCountries(true, searchTerm);
    } else {
      setCountriesList([]);
      setTotalCountries(0);
      setCurrentOffset(0);
    }
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange("");
    setSelectedCountry(null);
  };

  useEffect(() => {
    if (
      !appliedSearchTerm &&
      value &&
      !isLoading &&
      countriesList.length > 0 &&
      countriesList.length < totalCountries &&
      (shouldAutoLoadRef.current || !selectedCountry)
    ) {
      const match = countriesList.find((country) => country.name === value);

      if (!match) {
        fetchCountries(false, appliedSearchTerm);
      } else {
        shouldAutoLoadRef.current = false;
      }
    }
  }, [
    appliedSearchTerm,
    value,
    selectedCountry,
    isLoading,
    countriesList,
    totalCountries,
  ]);

  useEffect(() => {
    if (
      !appliedSearchTerm &&
      value &&
      selectedCountry &&
      !hasScrolledToSelectedCountryRef.current &&
      countriesList.length > 0
    ) {
      const match = countriesList.find((country) => country.name === value);

      if (
        match &&
        (!shouldAutoLoadRef.current || countriesList.length >= totalCountries)
      ) {
        requestAnimationFrame(() => {
          const selectedCountryElement = countryRefs.current[match.name];
          const listContainerElement = listContainerRef.current;

          if (selectedCountryElement && listContainerElement) {
            hasScrolledToSelectedCountryRef.current = true;

            const selectedCountryTop = selectedCountryElement.offsetTop;

            const idealScrollTop =
              selectedCountryTop -
              listContainerElement.clientHeight / 2 +
              selectedCountryElement.offsetHeight / 2;

            const maxScrollTop =
              listContainerElement.scrollHeight -
              listContainerElement.clientHeight;

            listContainerElement.scrollTo({
              top: Math.min(idealScrollTop, maxScrollTop),
              behavior: "smooth",
            });
          }
        });
      }
    }
  }, [
    appliedSearchTerm,
    value,
    selectedCountry,
    countriesList,
    totalCountries,
  ]);

  useEffect(() => {
    if (isOpen && countriesList.length === 0) {
      if (appliedSearchTerm) {
        const validation = searchCountriesSchema.safeParse({
          search: appliedSearchTerm,
        });

        if (validation.success) {
          fetchCountries(true, appliedSearchTerm);
        }
      } else {
        if (value) {
          shouldAutoLoadRef.current = true;
          hasScrolledToSelectedCountryRef.current = false;
        }
        fetchCountries(true, "");
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
      hasScrolledToSelectedCountryRef.current = false;
      shouldAutoLoadRef.current = false;
    }
  }, [isOpen, selectedCountry, appliedSearchTerm, value]);

  const handleScroll = () => {
    const container = listContainerRef.current;
    if (!container || isLoading) return;

    if (appliedSearchTerm) {
      const validation = searchCountriesSchema.safeParse({
        search: appliedSearchTerm,
      });
      if (!validation.success) return;
    }

    const threshold = 8;

    if (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - threshold
    ) {
      if (countriesList.length < totalCountries) {
        fetchCountries(false, appliedSearchTerm);
      }
    }
  };

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
          onClick={() => {
            if (appliedSearchTerm && !searchTerm) {
              setAppliedSearchTerm("");
              setCountriesList([]);
            } else if (!appliedSearchTerm) {
              setSearchTerm("");
              setCountriesList([]);
            }
          }}
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
          <div className="flex items-center gap-1 ">
            {value && (
              <div onClick={handleClear}>
                <X className="size-4 text-primary shrink-0" />
              </div>
            )}
            <ChevronDown className="text-muted-foreground/80 shrink-0" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="border-input w-(--radix-popper-anchor-width) p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <div className="relative">
            <CommandInput
              placeholder="Search countries..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              showSearchIcon={false}
              className="pr-5"
            />
            <Button
              size="icon-sm"
              variant="unstyled"
              onClick={handleSearchClick}
              disabled={isLoading}
              className="absolute top-1/2 right-0.5 -translate-y-1/2 cursor-pointer"
            >
              <Search className="size-4 shrink-0" />
            </Button>
          </div>

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
