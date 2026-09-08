export type SequenceStep = {
  id: string;
  label: string;
  delay: string;
  subject: string;
  body: string;
  bodyFormat?: "text" | "html";
  /** When true, subject is set at send time (Re: root subject). */
  subjectManaged?: boolean;
};

export type SequenceEditorAdapter = {
  load(): Promise<SequenceStep[]>;
  save(steps: SequenceStep[]): Promise<void>;
  preview?(stepId: string, steps: SequenceStep[]): Promise<{ subject: string; body: string; html?: string }>;
  variables: string[];
};
