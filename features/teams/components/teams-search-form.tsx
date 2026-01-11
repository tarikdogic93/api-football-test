"use client";

import { z } from "zod";
import {
  Building,
  Calendar,
  Code,
  Earth,
  Hash,
  Search,
  Trophy,
  Type,
} from "lucide-react";
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
import VenuesCombobox from "@/components/venues-combobox";
import { searchTeamsSchema } from "@/features/teams/schemas";

export type TeamsSearchValues = z.infer<typeof searchTeamsSchema>;

type TeamsSearchFormPropsType = {
  loading?: boolean;
  onSearch: (values: TeamsSearchValues) => void;
  defaultValues?: TeamsSearchValues;
};

export default function TeamsSearchForm({
  loading = false,
  onSearch,
  defaultValues = {
    id: "",
    name: "",
    league: "",
    season: "",
    country: "",
    code: "",
    venue: "",
    search: "",
  },
}: TeamsSearchFormPropsType) {
  const form = useForm<TeamsSearchValues>({
    resolver: zodResolver(searchTeamsSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSearch)}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
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
                  Team ID
                </Label>
                <FormControl>
                  <Input
                    id="id"
                    autoComplete="off"
                    placeholder="e.g. 42"
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
                    placeholder="e.g. Arsenal"
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
            name="league"
            render={({ field }) => (
              <FormItem>
                <Label
                  htmlFor="league"
                  className="text-xs flex items-center gap-1.5"
                >
                  <Trophy className="size-3" />
                  League ID
                </Label>
                <FormControl>
                  <Input
                    id="league"
                    autoComplete="off"
                    placeholder="e.g. 39"
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
            name="season"
            render={({ field }) => (
              <FormItem>
                <Label
                  htmlFor="season"
                  className="text-xs flex items-center gap-1.5"
                >
                  <Calendar className="size-3" />
                  Season
                </Label>
                <FormControl>
                  <Input
                    id="season"
                    autoComplete="off"
                    placeholder="e.g. 2023"
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
            name="code"
            render={({ field }) => (
              <FormItem>
                <Label
                  htmlFor="code"
                  className="text-xs flex items-center gap-1.5"
                >
                  <Code className="size-3" />
                  Team code
                </Label>
                <FormControl>
                  <Input
                    id="code"
                    autoComplete="off"
                    placeholder="e.g. ARS"
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
            name="venue"
            render={({ field, fieldState }) => (
              <FormItem>
                <Label
                  htmlFor="venue"
                  className="text-xs flex items-center gap-1.5"
                >
                  <Building className="size-3" />
                  Venue
                </Label>
                <FormControl>
                  <VenuesCombobox
                    id="venue"
                    value={field.value || ""}
                    onChange={(value) => field.onChange(value)}
                    disabled={loading}
                    isInvalid={!!fieldState.error}
                    selectedCountry={form.watch("country")}
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
                    placeholder="Search teams..."
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
