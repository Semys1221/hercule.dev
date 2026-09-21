import { HerculeMark } from "@/components/hercule-mark";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ClientPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ClientPageProps) {
  const { slug } = await params;
  return {
    title: `${slug} · Hercule`,
  };
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { slug } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center gap-3">
        <HerculeMark className="size-8 text-foreground" />
        <div>
          <p className="text-sm text-muted-foreground">Espace client</p>
          <h1 className="text-2xl font-semibold tracking-tight">{slug}</h1>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Tableau de bord</CardTitle>
          <CardDescription>
            Votre espace personnel Hercule — suivi de projet et livrables.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Le contenu du dashboard client sera branché ici prochainement.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
