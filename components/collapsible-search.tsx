"use client";

import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

type CollapsibleSearchPropsType = {
  children: React.ReactNode;
  title?: string;
  defaultOpen?: boolean;
};

export default function CollapsibleSearch({
  children,
  title = "Search filters",
  defaultOpen = false,
}: CollapsibleSearchPropsType) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="flex flex-col gap-2 border px-4 py-3 rounded-xl"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <CollapsibleTrigger asChild className="group">
          <Button variant="ghost" size="icon-sm" className="cursor-pointer">
            <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
            <span className="sr-only">Toggle {title}</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}
