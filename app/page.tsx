import { CornerUpLeft } from "lucide-react";

export default function Home() {
  return (
    <div className="h-full flex items-center justify-center gap-4">
      <CornerUpLeft />
      <p className="text-2xl">Choose an endpoint</p>
    </div>
  );
}
