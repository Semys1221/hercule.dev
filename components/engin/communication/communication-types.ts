export type CatalogItem = {
  id: string;
  kind: "sequence" | "notification";
  name: string;
  category: string;
  description: string;
  stepCount?: number;
  audiences?: string[];
};

export type SequenceStep = {
  id: string;
  label: string;
  delay: string;
  emailType?: string;
  subject: string;
  body: string;
  subjectManaged: boolean;
};

export type CommunicationSelection = { kind: "sequence" | "notification"; id: string };
