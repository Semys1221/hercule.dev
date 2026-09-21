import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormStepPreviewProps = {
  fields?: Array<{ label: string; required?: boolean }>;
};

const DEFAULT_FIELDS = [
  { label: "Prénom", required: true },
  { label: "Email", required: true },
  { label: "Société", required: false },
];

export function FormStepPreview({ fields = DEFAULT_FIELDS }: FormStepPreviewProps) {
  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div key={field.label} className="space-y-1">
          <Label className="text-xs">
            {field.label}
            {field.required ? " *" : ""}
          </Label>
          {field.label === "Message" ? (
            <Textarea disabled placeholder={field.label} className="min-h-16 resize-none" />
          ) : (
            <Input disabled placeholder={field.label} />
          )}
        </div>
      ))}
    </div>
  );
}
