import { PAGE_SIZES } from "@/lib/constants";
import PageSizeSelector from "@/components/page-size-selector";
import MiniPagination from "@/components/mini-pagination";

type FooterPropsType = {
  pageSize: number;
  currentPage: number;
  total: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (value: number) => void;
};

export default function Footer({
  pageSize,
  currentPage,
  total,
  loading,
  onPageChange,
  onPageSizeChange,
}: FooterPropsType) {
  const totalPages = Math.ceil(total / pageSize);

  if (total === 0) return null;

  return (
    <footer className="flex items-center justify-between">
      <PageSizeSelector
        pageSize={pageSize}
        pageSizes={PAGE_SIZES}
        disabled={loading}
        onChange={onPageSizeChange}
      />
      <div>
        <MiniPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          disabled={loading}
        />
      </div>
    </footer>
  );
}
