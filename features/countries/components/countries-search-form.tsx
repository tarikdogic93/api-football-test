"use client";

import { z } from "zod";
import { Code, Search, Type } from "lucide-react";
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
import { searchCountriesSchema } from "@/features/countries/schemas";

export type CountriesSearchValues = z.infer<typeof searchCountriesSchema>;

type CountriesSearchFormPropsType = {
  loading?: boolean;
  onSearch: (values: CountriesSearchValues) => void;
  defaultValues?: CountriesSearchValues;
};

export default function CountriesSearchForm({
  loading = false,
  onSearch,
  defaultValues = {
    name: "",
    code: "",
    search: "",
  },
}: CountriesSearchFormPropsType) {
  const form = useForm<CountriesSearchValues>({
    resolver: zodResolver(searchCountriesSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSearch)}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
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
                  Exact name
                </Label>
                <FormControl>
                  <Input
                    id="name"
                    autoComplete="off"
                    placeholder="e.g. England"
                    disabled={loading}
                    {...field}
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
                  Country code
                </Label>
                <FormControl>
                  <Input
                    id="code"
                    autoComplete="off"
                    placeholder="e.g. GB"
                    disabled={loading}
                    {...field}
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
                    placeholder="Search countries..."
                    disabled={loading}
                    {...field}
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
