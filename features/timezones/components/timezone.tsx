import { Card, CardContent } from "@/components/ui/card";
import { TimezoneType } from "@/features/timezones/types";

type TimezoneProps = TimezoneType;

export default function Timezone({ name }: TimezoneProps) {
  return (
    <Card>
      <CardContent>
        <p className="font-semibold text-primary text-center truncate max-w-full">
          {name}
        </p>
      </CardContent>
    </Card>
  );
}
