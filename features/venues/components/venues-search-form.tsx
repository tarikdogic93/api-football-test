"use client";

import { z } from "zod";
import { Building2, Earth, Hash, Search, Type } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import CountriesCombobox from "@/components/countries-combobox";
import { searchVenuesSchema } from "@/features/venues/schemas";

export type VenuesSearchValues = z.infer<typeof searchVenuesSchema>;

type VenuesSearchFormPropsType = {
  loading?: boolean;
  onSearch: (values: VenuesSearchValues) => void;
  defaultValues?: VenuesSearchValues;
};

export default function VenuesSearchForm({
  loading = false,
  onSearch,
  defaultValues = {
    id: "",
    name: "",
    city: "",
    country: "",
    search: "",
  },
}: VenuesSearchFormPropsType) {
  const form = useForm<VenuesSearchValues>({
    resolver: zodResolver(searchVenuesSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSearch)}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <Label
                  htmlFor="id"
                  className="text-xs flex items-center gap-1.5"
                >
                  <Hash className="size-3" />
                  Venue ID
                </Label>
                <FormControl>
                  <Input
                    id="id"
                    autoComplete="off"
                    placeholder="e.g. 556"
                    {...field}
                    onChange={(event) => field.onChange(event)}
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
              <FormItem>
                <Label
                  htmlFor="name"
                  className="text-xs flex items-center gap-1.5"
                >
                  <Type className="size-3" />
                  Name
                </Label>
                <FormControl>
                  <Input
                    id="name"
                    autoComplete="off"
                    placeholder="e.g. Old Trafford"
                    {...field}
                    onChange={(event) => field.onChange(event)}
                    disabled={loading}
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
              <FormItem>
                <Label
                  htmlFor="city"
                  className="text-xs flex items-center gap-1.5"
                >
                  <Building2 className="size-3" />
                  City
                </Label>
                <FormControl>
                  <Input
                    id="city"
                    autoComplete="off"
                    placeholder="e.g. Manchester"
                    {...field}
                    onChange={(event) => field.onChange(event)}
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
              <FormItem>
                <Label
                  htmlFor="country"
                  className="text-xs flex items-center gap-1.5"
                >
                  <Earth className="size-3" />
                  Country
                </Label>
                <FormControl>
                  <CountriesCombobox
                    id="country"
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
            name="search"
            render={({ field }) => (
              <FormItem>
                <Label
                  htmlFor="search"
                  className="text-xs flex items-center gap-1.5"
                >
                  <Search className="size-3" />
                  Search
                </Label>
                <FormControl>
                  <Input
                    id="search"
                    autoComplete="off"
                    placeholder="Search venues..."
                    {...field}
                    onChange={(event) => field.onChange(event)}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-fit cursor-pointer"
        >
          Search
        </Button>
      </form>
    </Form>
  );
}
