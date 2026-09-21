import { HerculeMark } from "@/components/hercule-mark";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EnginShell() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center gap-3">
        <HerculeMark className="size-8 text-foreground" />
        <div>
          <p className="text-sm text-muted-foreground">Admin</p>
          <h1 className="text-2xl font-semibold tracking-tight">Engin</h1>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Tableau de bord admin</CardTitle>
          <CardDescription>
            Espace opérateur Hercule — modules backend et interfaces internes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les modules seront ajoutés ici au fur et à mesure de la migration depuis
            l&apos;ancien espace internal.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
