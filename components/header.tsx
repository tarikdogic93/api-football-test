import { LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

type HeaderPropsType = {
  title: string;
  icon?: LucideIcon;
  loading: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
};

export default function Header({
  title,
  icon,
  loading,
  currentPage,
  pageSize,
  total,
}: HeaderPropsType) {
  const Icon = icon;

  return (
    <header>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="shrink-0" />}
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      {loading ? (
        <Skeleton className="h-5 w-24" />
      ) : (
        total > 0 && (
          <p className="text-sm text-muted-foreground">
            {(currentPage - 1) * pageSize + 1}&#45;
            {Math.min(currentPage * pageSize, total)} of {total}
          </p>
        )
      )}
    </header>
  );
}
