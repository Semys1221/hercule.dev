import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Truth = "db" | "code" | "derived";

type StateRow = {
  mode: "onboarding_preview" | "dashboard_state" | "dashboard_active";
  badgeClass: string;
  gate: string;
  ui: string;
  data: { field: string; truth: Truth }[];
  adminTrigger: string;
  clientExit: string;
};

const STATES: StateRow[] = [
  {
    mode: "onboarding_preview",
    badgeClass: "border-border text-muted-foreground",
    gate: "aucune row payments.status = succeeded",
    ui: "OnboardingPreviewWizard — 6 étapes : screen share, preview, form tease, FAQ/tie-down, pricing 1 489 €, Stripe embed",
    data: [
      { field: "slug / email / firstName / company", truth: "db" },
      { field: "profile.faq", truth: "db" },
      { field: "FAQ fallback + copy wizard", truth: "code" },
      { field: "prix 1 489 € / CGV_VERSION", truth: "code" },
    ],
    adminTrigger:
      "Session closing → Copier le lien (dashboard_link posé au webhook Calendly MEETING_BOOKED)",
    clientExit: "Stripe checkout → webhook checkout.session.completed → PAID_PENDING_ONBOARDING",
  },
  {
    mode: "dashboard_state",
    badgeClass: "border-amber-500/40 text-amber-400",
    gate: "paiement succeeded ET onboarding_completed_at IS NULL",
    ui: "DashboardState — timeline 4 steps + CTA « Compléter mon onboarding » → OnboardingFormModal",
    data: [
      { field: "profile.form (préfill qualification)", truth: "db" },
      { field: "product_statut = PAID_PENDING_ONBOARDING", truth: "db" },
      { field: "timeline profile.display.timeline", truth: "db" },
      { field: "timeline fallback 4 steps", truth: "code" },
    ],
    adminTrigger: "Webhook Stripe checkout.session.completed (pas un bouton admin)",
    clientExit: "PATCH /api/dashboard/[slug] completeOnboarding=true → IN_DELIVERANCE",
  },
  {
    mode: "dashboard_active",
    badgeClass: "border-emerald-500/40 text-emerald-400",
    gate: "paiement succeeded ET onboarding_completed_at IS NOT NULL",
    ui: "DashboardActive — badges, NextStepBlock, RdvStatusCard, chronologie, DeliveryDetailsCard, no-show",
    data: [
      { field: "product_statut / scheduled_at / form", truth: "db" },
      { field: "profile.display.timeline", truth: "db" },
      { field: "buildDefaultMilestones +7/+11/+15 j ouvrés", truth: "code" },
      { field: "dashboardMode", truth: "derived" },
    ],
    adminTrigger:
      "handleMatchBooking (Calendly UTM match:) → MEETING_BOOKED — sous-état, même mode",
    clientExit: "Pas de sortie de mode. No-show = emails seulement (pas d’écriture DB).",
  },
];

const FLOW_STEPS = [
  { id: "open", label: "/dashboard/[slug]" },
  { id: "preview", label: "onboarding_preview" },
  { id: "paid", label: "PAID_PENDING_ONBOARDING" },
  { id: "state", label: "dashboard_state" },
  { id: "onboard", label: "IN_DELIVERANCE" },
  { id: "active", label: "dashboard_active" },
  { id: "booked", label: "MEETING_BOOKED" },
  { id: "survey", label: "POST_RDV_SURVEY (TODO)" },
] as const;

const GAPS = [
  {
    title: "scheduled_at non mis à jour au match booking",
    file: "lib/matching/orchestrator.ts — handleMatchBooking",
    impact: "RdvStatusCard affiche encore la date du call commercial.",
  },
  {
    title: "POST_RDV_SURVEY a du copy UI mais aucun writer",
    file: "components/dashboard/next-step-block.tsx + sendPostRdvSurveys",
    impact: "Le cron envoie les surveys sans changer product_statut.",
  },
  {
    title: "Cockpit /internal/clients/[category]/[slug]",
    file: "app/internal/(shell)/clients/[category]/[slug]",
    impact: "Liste Parcours : /internal/funnels/agence/clients — actions délivrance dans le cockpit.",
  },
  {
    title: "MATCH_PROPOSED écrit seulement sur entreprise",
    file: "lib/matching/orchestrator.ts — createMatchAndPropose",
    impact: "L’agence reste IN_DELIVERANCE pendant la proposition.",
  },
  {
    title: "zone non prérempli depuis la qualification",
    file: "lib/admin/onboarding/qualification-mapper.ts",
    impact: "Le client doit saisir la zone dans le formulaire onboarding.",
  },
  {
    title: "Emails J0/J1 onboarding-sequence non déclenchés",
    file: "app/api/dashboard/[slug]/route.ts PATCH (TODO commenté)",
    impact: "completeOnboarding lance Calendly seat, pas la séquence J0.",
  },
] as const;

function TruthBadge({ truth }: { truth: Truth }) {
  const label = truth === "db" ? "DB" : truth === "code" ? "Code" : "Dérivé";
  return (
    <Badge variant="outline" className="font-mono text-[10px] uppercase">
      {label}
    </Badge>
  );
}

export function DashboardStateTable() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Machine d&apos;état client</CardTitle>
          <CardDescription>
            `dashboardMode` n&apos;est jamais stocké — il est calculé dans GET
            /api/dashboard/[slug] à partir de `payments` et `onboarding_completed_at`.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-wrap items-center gap-2">
            {FLOW_STEPS.map((step, index) => (
              <li key={step.id} className="flex items-center gap-2">
                <Badge variant="secondary" className="whitespace-normal">
                  {step.label}
                </Badge>
                {index < FLOW_STEPS.length - 1 ? (
                  <span className="text-muted-foreground" aria-hidden>
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>États UI</CardTitle>
          <CardDescription>
            Trois modes. Les valeurs `product_statut` plus tardives (MEETING_BOOKED,
            POST_RDV_SURVEY) sont des sous-états de `dashboard_active`.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mode</TableHead>
                <TableHead>Gate</TableHead>
                <TableHead>UI rendue</TableHead>
                <TableHead>Données</TableHead>
                <TableHead>Trigger admin</TableHead>
                <TableHead>Sortie client</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STATES.map((row) => (
                <TableRow key={row.mode}>
                  <TableCell className="align-top whitespace-normal">
                    <Badge variant="outline" className={row.badgeClass}>
                      {row.mode}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top max-w-48 whitespace-normal font-mono text-xs text-muted-foreground">
                    {row.gate}
                  </TableCell>
                  <TableCell className="align-top max-w-64 whitespace-normal text-sm">
                    {row.ui}
                  </TableCell>
                  <TableCell className="align-top min-w-52 whitespace-normal">
                    <ul className="space-y-2">
                      {row.data.map((item) => (
                        <li key={item.field} className="flex flex-col gap-1">
                          <span className="text-xs leading-snug">{item.field}</span>
                          <TruthBadge truth={item.truth} />
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="align-top max-w-56 whitespace-normal text-sm">
                    {row.adminTrigger}
                  </TableCell>
                  <TableCell className="align-top max-w-56 whitespace-normal text-sm">
                    {row.clientExit}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Écarts connus</CardTitle>
          <CardDescription>
            Vérité codebase — à traiter depuis le cockpit ou les orchestrateurs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {GAPS.map((gap) => (
              <li key={gap.title} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <p className="font-medium">{gap.title}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{gap.file}</p>
                <p className="mt-1 text-sm text-muted-foreground">{gap.impact}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
