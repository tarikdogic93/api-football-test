import { Suspense } from "react";

import VenuesContent from "@/features/venues/components/venues-content";

export default function VenuesPage() {
  return (
    <Suspense>
      <VenuesContent />
    </Suspense>
  );
}
