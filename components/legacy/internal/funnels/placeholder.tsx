import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type FunnelPlaceholderProps = {
  title: string;
  detail?: string;
};

export function FunnelPlaceholder({ title, detail }: FunnelPlaceholderProps) {
  return (
    <Alert>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{detail ?? "Contenu à venir."}</AlertDescription>
    </Alert>
  );
}
