import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type InternalStatusAlertProps = {
  variant: "error" | "success" | "info";
  message: string;
  title?: string;
  className?: string;
};

const ICONS = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
} as const;

export function InternalStatusAlert({
  variant,
  message,
  title,
  className,
}: InternalStatusAlertProps) {
  const Icon = ICONS[variant];

  return (
    <Alert
      variant={variant === "error" ? "destructive" : "default"}
      className={cn(
        variant === "success" &&
          "border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100",
        className,
      )}
    >
      <Icon />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription
        className={cn(
          variant === "success" && "text-green-900 dark:text-green-100",
        )}
      >
        {message}
      </AlertDescription>
    </Alert>
  );
}
