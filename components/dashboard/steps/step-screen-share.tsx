"use client";

const STEPS = [
  {
    title: "Rejoignez l'appel visio",
    detail: "Ouvrez le lien de réunion que vous avez reçu par email.",
  },
  {
    title: "Cliquez « Partager l'écran »",
    detail: "Icône en bas de l'interface Google Meet ou Zoom.",
  },
  {
    title: "Sélectionnez « Tout l'écran »",
    detail: "Choisissez votre écran principal puis confirmez le partage.",
  },
  {
    title: "Naviguez librement",
    detail: "L'auditeur vous accompagne et vous guide en temps réel.",
  },
];

export function StepScreenShare() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-medium">Partage d&apos;écran</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivez ces étapes pendant l&apos;appel avec votre auditeur.
        </p>
      </div>

      <ol className="space-y-4">
        {STEPS.map((item, i) => (
          <li key={i} className="flex gap-4">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium text-muted-foreground">
              {i + 1}
            </span>
            <div className="pt-0.5">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
