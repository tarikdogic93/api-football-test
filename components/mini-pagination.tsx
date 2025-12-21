"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

type MiniPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
};

export default function MiniPagination({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
}: MiniPaginationProps) {
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  return (
    <Pagination>
      <PaginationContent className="gap-2">
        <PaginationItem>
          <PaginationLink
            href="#"
            onClick={() => goToPage(1)}
            isActive={false}
            isDisabled={loading || currentPage === 1}
          >
            <ChevronsLeft />
          </PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <PaginationLink
            href="#"
            onClick={() => goToPage(currentPage - 1)}
            isActive={false}
            isDisabled={loading || currentPage === 1}
          >
            <ChevronLeft />
          </PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <p className="text-sm">
            Page {currentPage} of {totalPages > 0 ? totalPages : 1}
          </p>
        </PaginationItem>

        <PaginationItem>
          <PaginationLink
            href="#"
            onClick={() => goToPage(currentPage + 1)}
            isActive={false}
            isDisabled={loading || currentPage === totalPages}
          >
            <ChevronRight />
          </PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <PaginationLink
            href="#"
            onClick={() => goToPage(totalPages)}
            isActive={false}
            isDisabled={loading || currentPage === totalPages}
          >
            <ChevronsRight />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
