import Image from "next/image";

import { CountryType } from "@/types";

type CountryProps = CountryType;

export default function Country({ name, code, flag }: CountryProps) {
  return (
    <div className="p-4 shadow rounded flex flex-col items-center gap-1">
      <div className="relative w-16 h-10">
        {flag ? (
          <Image
            src={flag}
            alt={name}
            fill
            className="object-cover rounded-md"
          />
        ) : (
          <div className="w-full h-full bg-accent rounded-md" />
        )}
      </div>
      <p className="font-semibold text-primary truncate">{name}</p>
      <p className="text-sm text-accent-foreground">{code ?? "—"}</p>
    </div>
  );
}
