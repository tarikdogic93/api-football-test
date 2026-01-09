import Image from "next/image";

import { TeamType } from "@/features/teams/types";

type TeamPropsType = TeamType;

export default function Team({
  name,
  code,
  country,
  founded,
  national,
  logo,
}: TeamPropsType) {
  return (
    <div className="p-4 shadow rounded flex flex-col items-center text-center gap-1">
      <div className="relative w-28 h-28">
        {logo ? (
          <Image
            src={logo}
            alt={`${name} logo`}
            fill
            className="object-contain rounded-full"
            unoptimized
          />
        ) : (
          <div className="w-28 h-28 bg-accent rounded-full" />
        )}
      </div>
      <p className="font-semibold text-primary truncate max-w-full">{name}</p>
      <p className="text-xs text-accent-foreground">
        <span className="font-semibold">Code:</span> {code ?? "—"}
      </p>
      <p className="text-xs text-accent-foreground">
        <span className="font-semibold">Country:</span> {country ?? "—"}
      </p>
      <p className="text-xs text-accent-foreground">
        <span className="font-semibold">Founded:</span> {founded ?? "—"}
      </p>
      <p className="text-xs text-accent-foreground">
        <span className="font-semibold">National:</span>{" "}
        {national ? "Yes" : "No"}
      </p>
    </div>
  );
}
