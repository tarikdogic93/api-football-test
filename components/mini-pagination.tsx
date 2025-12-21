"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
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
        <PaginationPrevious
          href="#"
          onClick={() => goToPage(currentPage - 1)}
          isActive={false}
          isDisabled={loading || currentPage === 1}
        />

        <PaginationItem>
          <p className="text-sm">
            Page {currentPage} of {totalPages > 0 ? totalPages : 1}
          </p>
        </PaginationItem>

        <PaginationNext
          href="#"
          onClick={() => goToPage(currentPage + 1)}
          isActive={false}
          isDisabled={loading || currentPage === totalPages}
        />
      </PaginationContent>
    </Pagination>
  );
}
