import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type QuestionStepPreviewProps = {
  prompt?: string;
  answers?: string[];
};

export function QuestionStepPreview({
  prompt = "Quel est votre besoin principal ?",
  answers = ["Site vitrine", "E-commerce", "Refonte"],
}: QuestionStepPreviewProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{prompt}</p>
      <div className="space-y-2">
        {answers.map((answer) => (
          <label key={answer} className="flex items-center gap-2 text-sm">
            <Checkbox checked={false} disabled />
            <span>{answer}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
