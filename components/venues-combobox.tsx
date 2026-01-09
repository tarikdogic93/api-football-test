"use client";

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
import { VenuesAPIResponse, VenueType } from "@/features/venues/types";
import { searchVenuesSchema } from "@/features/venues/schemas";

type VenuesComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isInvalid?: boolean;
  selectedCountry?: string;
};

export default function VenuesCombobox({
  value,
  onChange,
  disabled,
  isInvalid,
  selectedCountry,
}: VenuesComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [venuesList, setVenuesList] = useState<VenueType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalVenues, setTotalVenues] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [selectedVenue, setSelectedVenue] = useState<VenueType | null>(null);
  const [error, setError] = useState("");
  const [lastLoadedCountry, setLastLoadedCountry] = useState<string>("");

  const listContainerRef = useRef<HTMLDivElement>(null);
  const venueRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasScrolledToSelectedVenueRef = useRef(false);
  const shouldAutoLoadRef = useRef(false);

  const fetchVenues = async (reset = false, searchQuery = "", country = "") => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    const queryParams = new URLSearchParams();
    queryParams.set("pageSize", DEFAULT_PAGE_SIZE.toString());
    queryParams.set("offset", reset ? "0" : currentOffset.toString());
    if (searchQuery) queryParams.set("search", searchQuery);
    if (country) queryParams.set("country", country);

    try {
      const response = await fetch(`/api/venues?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch venues");
      const data: VenuesAPIResponse = await response.json();

      const venues = data.venues || [];

      if (reset) {
        setVenuesList(venues);
        setCurrentOffset(data.offset || 0);
        setLastLoadedCountry(country);
      } else {
        setVenuesList((prevVenues) => [...prevVenues, ...venues]);
        setCurrentOffset(data.offset || currentOffset);
      }

      setTotalVenues(data.total || 0);
    } catch {
      setError("Could not load venues");
      if (reset) setVenuesList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchClick = () => {
    if (!searchTerm) {
      if (value) {
        shouldAutoLoadRef.current = true;
        hasScrolledToSelectedVenueRef.current = false;
      }
      setAppliedSearchTerm("");
      setVenuesList([]);

      if (selectedCountry) {
        fetchVenues(true, "", selectedCountry);
      }
      return;
    }

    const validation = searchVenuesSchema.safeParse({
      search: searchTerm,
    });

    if (validation.success) {
      setAppliedSearchTerm(searchTerm);
      fetchVenues(true, searchTerm, selectedCountry || "");
    } else {
      setVenuesList([]);
      setTotalVenues(0);
      setCurrentOffset(0);
    }
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange("");
    setSelectedVenue(null);
  };

  useEffect(() => {
    if (
      !appliedSearchTerm &&
      value &&
      !isLoading &&
      venuesList.length > 0 &&
      venuesList.length < totalVenues &&
      (shouldAutoLoadRef.current || !selectedVenue)
    ) {
      const match = venuesList.find((venue) => venue.id.toString() === value);

      if (!match) {
        fetchVenues(false, appliedSearchTerm, selectedCountry || "");
      } else {
        shouldAutoLoadRef.current = false;
      }
    }
  }, [
    appliedSearchTerm,
    value,
    selectedVenue,
    isLoading,
    venuesList,
    totalVenues,
    selectedCountry,
  ]);

  useEffect(() => {
    if (
      !appliedSearchTerm &&
      value &&
      selectedVenue &&
      !hasScrolledToSelectedVenueRef.current &&
      venuesList.length > 0
    ) {
      const match = venuesList.find((venue) => venue.id.toString() === value);

      if (
        match &&
        (!shouldAutoLoadRef.current || venuesList.length >= totalVenues)
      ) {
        requestAnimationFrame(() => {
          const selectedVenueElement = venueRefs.current[match.id.toString()];
          const listContainerElement = listContainerRef.current;

          if (selectedVenueElement && listContainerElement) {
            hasScrolledToSelectedVenueRef.current = true;

            const selectedVenueTop = selectedVenueElement.offsetTop;

            const idealScrollTop =
              selectedVenueTop -
              listContainerElement.clientHeight / 2 +
              selectedVenueElement.offsetHeight / 2;

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
  }, [appliedSearchTerm, value, selectedVenue, venuesList, totalVenues]);

  useEffect(() => {
    if (
      isOpen &&
      (venuesList.length === 0 || lastLoadedCountry !== (selectedCountry || ""))
    ) {
      if (appliedSearchTerm) {
        const validation = searchVenuesSchema.safeParse({
          search: appliedSearchTerm,
        });

        if (validation.success) {
          fetchVenues(true, appliedSearchTerm, selectedCountry || "");
        }
      } else {
        if (selectedCountry) {
          if (value) {
            shouldAutoLoadRef.current = true;
            hasScrolledToSelectedVenueRef.current = false;
          }
          fetchVenues(true, "", selectedCountry);
        }
      }
    }

    if (isOpen && selectedVenue && !hasScrolledToSelectedVenueRef.current) {
      requestAnimationFrame(() => {
        const selectedVenueElement =
          venueRefs.current[selectedVenue.id.toString()];
        const listContainerElement = listContainerRef.current;

        if (selectedVenueElement && listContainerElement) {
          const selectedVenueTop = selectedVenueElement.offsetTop;
          const selectedVenueBottom =
            selectedVenueTop + selectedVenueElement.offsetHeight;

          if (
            selectedVenueTop < listContainerElement.scrollTop ||
            selectedVenueBottom >
              listContainerElement.scrollTop + listContainerElement.clientHeight
          ) {
            listContainerElement.scrollTo({
              top:
                selectedVenueTop -
                listContainerElement.clientHeight / 2 +
                selectedVenueElement.offsetHeight / 2,
              behavior: "smooth",
            });
          }

          hasScrolledToSelectedVenueRef.current = true;
        }
      });
    }

    if (!isOpen) {
      hasScrolledToSelectedVenueRef.current = false;
      shouldAutoLoadRef.current = false;
    }
  }, [
    isOpen,
    selectedVenue,
    appliedSearchTerm,
    value,
    selectedCountry,
    lastLoadedCountry,
  ]);

  const handleScroll = () => {
    const container = listContainerRef.current;
    if (!container || isLoading) return;

    if (appliedSearchTerm) {
      const validation = searchVenuesSchema.safeParse({
        search: appliedSearchTerm,
      });
      if (!validation.success) return;
    }

    const threshold = 8;

    if (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - threshold
    ) {
      if (venuesList.length < totalVenues) {
        fetchVenues(false, appliedSearchTerm, selectedCountry || "");
      }
    }
  };

  useEffect(() => {
    if (!value) {
      setSelectedVenue(null);
      return;
    }

    if (selectedVenue?.id.toString() === value) return;

    const match = venuesList.find((venue) => venue.id.toString() === value);
    if (match) {
      setSelectedVenue(match);
    }
  }, [value, venuesList, selectedVenue]);

  useEffect(() => {
    if (lastLoadedCountry !== (selectedCountry || "")) {
      setVenuesList([]);
      setAppliedSearchTerm("");
      setSearchTerm("");
      setTotalVenues(0);
      setCurrentOffset(0);
    }
  }, [selectedCountry, lastLoadedCountry]);

  const isInitialLoading = isLoading && venuesList.length === 0;
  const isLoadingMore = isLoading && venuesList.length > 0;

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
              setVenuesList([]);
            } else if (!appliedSearchTerm) {
              setSearchTerm("");
              setVenuesList([]);
            }
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {value ? (
              <span className="truncate">{selectedVenue?.name || value}</span>
            ) : (
              <span className="text-muted-foreground truncate">
                Select venue
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
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
              placeholder="Search venues..."
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

            {!isLoading &&
              !error &&
              venuesList.length === 0 &&
              !selectedCountry && (
                <CommandEmpty className="px-2 py-1.5">
                  Select a country or use search
                </CommandEmpty>
              )}

            {!isLoading &&
              !error &&
              venuesList.length === 0 &&
              selectedCountry && (
                <CommandEmpty className="px-2 py-1.5">
                  No venues found
                </CommandEmpty>
              )}

            {venuesList.map((venue) => (
              <CommandItem
                key={`${venue.id}-${venue.name}`}
                value={venue.id.toString()}
                ref={(element) => {
                  venueRefs.current[venue.id.toString()] = element;
                }}
                onSelect={(selectedValue) => {
                  if (value === selectedValue) {
                    onChange("");
                    setSelectedVenue(null);
                  } else {
                    onChange(selectedValue);
                    setSelectedVenue(venue);
                  }
                  setIsOpen(false);
                }}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate">{venue.name}</span>
                  {venue.city && (
                    <span className="text-xs text-muted-foreground truncate">
                      {venue.city}
                      {venue.country && `, ${venue.country}`}
                    </span>
                  )}
                </div>
                {value === venue.id.toString() && (
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
