"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PageSizeSelectorProps = {
  pageSize: number;
  pageSizes: number[];
  onChange: (value: number) => void;
};

export default function PageSizeSelector({
  pageSize,
  pageSizes,
  onChange,
}: PageSizeSelectorProps) {
  const handleChange = (value: string) => {
    onChange(Number(value));
  };

  return (
    <div className="flex items-center gap-4">
      <Label htmlFor="pageSize">Page size:</Label>
      <Select
        name="pageSize"
        value={pageSize.toString()}
        onValueChange={handleChange}
      >
        <SelectTrigger id="pageSize" className="w-[120px] cursor-pointer">
          <SelectValue placeholder="Page size" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {pageSizes.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
