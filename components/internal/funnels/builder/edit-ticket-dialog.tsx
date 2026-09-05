"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { CursorImpact } from "@/lib/admin/funnels/schema";
import { CursorImpactField } from "@/components/internal/funnels/builder/cursor-impact-field";

const editTicketFormSchema = z.object({
  command: z.string().min(1, "Décrivez les modifications souhaitées."),
  cursorImpact: z.enum(["light", "medium", "high"]),
});

type EditTicketFormValues = z.infer<typeof editTicketFormSchema>;

type EditTicketDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  defaultImpact?: CursorImpact;
  onSubmit: (values: EditTicketFormValues) => Promise<void>;
};

export function EditTicketDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultImpact = "medium",
  onSubmit,
}: EditTicketDialogProps) {
  const form = useForm<EditTicketFormValues>({
    resolver: zodResolver(editTicketFormSchema),
    defaultValues: {
      command: "",
      cursorImpact: defaultImpact,
    },
  });

  async function handleSubmit(values: EditTicketFormValues) {
    await onSubmit(values);
    form.reset({ command: "", cursorImpact: defaultImpact });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="command"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions pour Cursor</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={6}
                      placeholder="Décrivez le layout ou composant souhaité…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cursorImpact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cursor impact</FormLabel>
                  <FormControl>
                    <CursorImpactField value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Enregistrer le brief
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
