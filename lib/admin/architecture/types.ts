import { z } from "zod";

export const componentKindSchema = z.enum([
  "component",
  "api_route",
  "webhook",
  "cron",
  "orchestrator",
]);

export const componentDomainSchema = z.enum([
  "sales_funnel",
  "onboarding_funnel",
  "dashboard_internal",
  "dashboard_client",
  "crm",
  "marketing",
  "communication",
]);

export const componentRoleSchema = z.enum([
  "recipient",
  "trigger",
  "edition",
  "orchestrator",
]);

export const componentActorSchema = z.enum(["admin", "client", "system"]);

export const componentStorageSchema = z.enum([
  "supabase",
  "filesystem",
  "hybrid",
  "none",
]);

export const componentStatusSchema = z.enum(["built", "wip", "spec"]);

export const componentEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: componentKindSchema,
  domain: componentDomainSchema,
  role: componentRoleSchema,
  actor: componentActorSchema,
  route: z.string().min(1),
  dataIn: z.string(),
  dataOut: z.string(),
  sideEffects: z.string(),
  storage: componentStorageSchema,
  status: componentStatusSchema,
});

export const componentsRegistrySchema = z.array(componentEntrySchema);

export const databaseDomainSchema = z.enum([
  "product",
  "crm",
  "communication",
  "marketing",
  "ai",
  "instantly",
]);

export const databaseActorSchema = z.enum([
  "admin",
  "client",
  "webhook",
  "cron",
  "public",
]);

export const databaseStatusSchema = z.enum(["migrated", "planned"]);

export const databaseEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  domain: databaseDomainSchema,
  purpose: z.string().min(1),
  keyColumns: z.string().min(1),
  writers: z.array(databaseActorSchema).min(1),
  readers: z.array(databaseActorSchema).min(1),
  profileKeys: z.string().optional(),
  relatedTables: z.array(z.string()),
  status: databaseStatusSchema,
});

export const databaseRegistrySchema = z.array(databaseEntrySchema);

export type ComponentKind = z.infer<typeof componentKindSchema>;
export type ComponentDomain = z.infer<typeof componentDomainSchema>;
export type ComponentRole = z.infer<typeof componentRoleSchema>;
export type ComponentActor = z.infer<typeof componentActorSchema>;
export type ComponentStorage = z.infer<typeof componentStorageSchema>;
export type ComponentStatus = z.infer<typeof componentStatusSchema>;
export type ComponentEntry = z.infer<typeof componentEntrySchema>;

export type DatabaseDomain = z.infer<typeof databaseDomainSchema>;
export type DatabaseActor = z.infer<typeof databaseActorSchema>;
export type DatabaseStatus = z.infer<typeof databaseStatusSchema>;
export type DatabaseEntry = z.infer<typeof databaseEntrySchema>;

export const COMPONENT_DOMAIN_LABELS: Record<ComponentDomain, string> = {
  sales_funnel: "Sales funnel",
  onboarding_funnel: "Onboarding funnel",
  dashboard_internal: "Dashboard interne",
  dashboard_client: "Dashboard client",
  crm: "CRM",
  marketing: "Marketing",
  communication: "Communication",
};

export const COMPONENT_ROLE_LABELS: Record<ComponentRole, string> = {
  recipient: "Recipient",
  trigger: "Trigger",
  edition: "Edition",
  orchestrator: "Orchestrator",
};

export const COMPONENT_KIND_LABELS: Record<ComponentKind, string> = {
  component: "Component",
  api_route: "API route",
  webhook: "Webhook",
  cron: "Cron",
  orchestrator: "Orchestrator",
};

export const COMPONENT_STATUS_LABELS: Record<ComponentStatus, string> = {
  built: "Built",
  wip: "WIP",
  spec: "Spec",
};

export const DATABASE_DOMAIN_LABELS: Record<DatabaseDomain, string> = {
  product: "Product",
  crm: "CRM",
  communication: "Communication",
  marketing: "Marketing",
  ai: "AI",
  instantly: "Instantly",
};

export const DATABASE_STATUS_LABELS: Record<DatabaseStatus, string> = {
  migrated: "Migrated",
  planned: "Planned",
};
