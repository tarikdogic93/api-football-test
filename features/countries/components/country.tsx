import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { CountryType } from "@/features/countries/types";

type CountryProps = CountryType;

export default function Country({ name, code, flag }: CountryProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1">
        <div className="relative w-16 h-10">
          {flag ? (
            <Image
              src={flag}
              alt={name}
              fill
              className="object-cover rounded-md"
            />
          ) : (
            <div className="w-16 h-10 bg-accent rounded-md" />
          )}
        </div>
        <p className="font-semibold text-primary truncate max-w-full">{name}</p>
        <p className="text-sm text-accent-foreground">{code ?? "—"}</p>
      </CardContent>
    </Card>
  );
}
