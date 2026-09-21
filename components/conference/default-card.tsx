import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GeometricBanana } from "@/components/conference/geometric-banana";

export function ConferenceDefaultCard() {
  return (
    <Card className="w-full max-w-sm border-border bg-card">
      <CardHeader>
        <CardTitle>Conférence</CardTitle>
        <CardDescription>Espace prêt — tokens CSS du projet actifs.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="text-foreground">
          <GeometricBanana />
        </div>
      </CardContent>
    </Card>
  );
}
