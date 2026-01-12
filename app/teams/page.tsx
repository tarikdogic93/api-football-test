import { Suspense } from "react";

import TeamsContent from "@/features/teams/components/teams-content";

export default function TeamsPage() {
  return (
    <Suspense>
      <TeamsContent />
    </Suspense>
  );
}
