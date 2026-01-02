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
};

export default function CountriesCombobox({
  value,
  onChange,
  disabled,
}: CountriesComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [countriesList, setCountriesList] = useState<CountryType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCountries, setTotalCountries] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const hasSearchedRef = useRef(false);

  const fetchCountries = async (reset = false) => {
    if (isLoading) return;
    setIsLoading(true);

    const queryParams = new URLSearchParams();
    queryParams.set("pageSize", DEFAULT_PAGE_SIZE.toString());
    queryParams.set("offset", reset ? "0" : currentOffset.toString());
    if (searchTerm) queryParams.set("search", searchTerm);

    try {
      const response = await fetch(`/api/countries?${queryParams.toString()}`);
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
    } catch (error) {
      console.log(error);
      if (reset) setCountriesList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && countriesList.length === 0 && !hasSearchedRef.current) {
      fetchCountries(true);
    }

    if (!isOpen) {
      hasSearchedRef.current = false;
    }
  }, [isOpen]);

  const handleScroll = () => {
    const container = listContainerRef.current;
    if (!container || isLoading) return;

    if (
      container.scrollTop + container.clientHeight ===
      container.scrollHeight
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
        fetchCountries(true);
        return;
      }

      if (!searchTerm) {
        return;
      }

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

  const selectedCountryData = countriesList.find(
    (country) => country.name === value
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="min-w-0 bg-background hover:bg-background border-input justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]"
        >
          {value ? (
            <div className="flex items-center gap-2 min-w-0">
              {selectedCountryData?.flag && (
                <div className="relative w-5 h-4 shrink-0">
                  <Image
                    src={selectedCountryData.flag}
                    alt={value}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <span className="truncate">{value}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select country</span>
          )}
          <ChevronDown className="text-muted-foreground/80 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="border-input w-(--radix-popper-anchor-width) p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search country..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList
            ref={listContainerRef}
            onScroll={handleScroll}
            className="max-h-60 overflow-y-auto"
          >
            {countriesList.length === 0 && !isLoading && (
              <CommandEmpty className="px-2 py-1.5">
                No country found.
              </CommandEmpty>
            )}
            {countriesList.map((country) => (
              <CommandItem
                key={country.code}
                value={country.name}
                onSelect={(selectedValue) => {
                  onChange(selectedValue);
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
