/**
 * User-facing labels for the internal parcours / session UI.
 *
 * Vocabulary:
 * - Parcours — product root (formerly "Funnels" / "Funnel Builder")
 * - Session — live client session module (formerly "Sales")
 * - Audit institutionnel — post-qualification phase (formerly "Pitch")
 *
 * URLs and code identifiers may still use sales/funnel — only UI strings here.
 */

export const PRODUCT_ROOT_LABEL = "Parcours";
export const PRODUCT_BUILDER_LABEL = "Éditeur de parcours";
export const PRODUCT_BUILDER_TOOLTIP = PRODUCT_BUILDER_LABEL;

export function productBuilderSubtitle(audienceLabel: string): string {
  return `${PRODUCT_BUILDER_LABEL} · ${audienceLabel}`;
}

export function productPageTitle(audienceLabel: string): string {
  return `${PRODUCT_ROOT_LABEL} — ${audienceLabel}`;
}

export const SESSION_MODULE_LABEL = "Session";
export const SESSION_MODULE_CAPTION = "Hub admin et session client.";

export const SESSION_PHASE_QUALIFICATION = "Session";
export const SESSION_PHASE_INSTITUTIONAL = "Audit institutionnel";
export const SESSION_SIDEBAR_INSTITUTIONAL = "Institutionnel";
export const SESSION_SIDEBAR_STEPS = "Étapes";

export const SESSION_SETTINGS_LABEL = "Réglages de la session";
export const SESSION_SETTINGS_BACK_ARIA = "Retour à la session";
export const SESSION_SETTINGS_DESCRIPTION = "Préférences de la session client.";
export const SESSION_OPEN_CTA = "Ouvrir la session";
export const SESSION_BACK_CTA = "Retour à la session";
export const SESSION_EXIT_CTA = "Quitter";
export const SESSION_ENTER_INSTITUTIONAL_CTA = "Passer à l'audit institutionnel";

export const SESSION_SIDEBAR_SETTINGS_ARIA = SESSION_SETTINGS_LABEL;

export const SESSION_INSTITUTIONAL_SIDEBAR_TITLE = "Sidebar institutionnelle";
export const SESSION_INSTITUTIONAL_SIDEBAR_DESCRIPTION =
  "Bascule automatiquement vers l'audit institutionnel à la fin de la qualification.";
export const SESSION_INSTITUTIONAL_SIDEBAR_TOGGLE = "Activer la sidebar institutionnelle";
export const SESSION_INSTITUTIONAL_SIDEBAR_ON =
  "Les sections institutionnelles sont visibles dans la sidebar. Le panneau principal basculera automatiquement à l'audit institutionnel une fois la qualification terminée.";
export const SESSION_INSTITUTIONAL_SIDEBAR_OFF =
  "La sidebar reste en mode qualification. Un bouton « Passer à l'audit institutionnel » apparaîtra à la fin.";

export const SESSION_DEVELOPER_MODE_TITLE = "Mode développeur";
export const SESSION_DEVELOPER_MODE_DESCRIPTION =
  "Navigation libre entre toutes les étapes et contournement des restrictions de completion pour tester le parcours.";
export const SESSION_DEVELOPER_MODE_TOGGLE = "Activer le mode développeur";
export const SESSION_DEVELOPER_MODE_ON =
  "Toutes les étapes (qualification et pitch) sont accessibles sans remplir le questionnaire.";
export const SESSION_DEVELOPER_MODE_OFF = "Parcours live standard — les gates de completion s'appliquent.";
export const SESSION_DEVELOPER_MODE_BADGE = "DEV";
export const SESSION_DEVELOPER_MODE_FAKE_LINK =
  "Lien fictif — mode développeur. Sélectionnez un RDV pour tester le flux réel.";

export const SESSION_SETTINGS_TAB_GENERAL = "Général";
export const SESSION_SETTINGS_TAB_PREPARATION = "Préparation";

export const SESSION_WAITING_QUEUE_TITLE = "File d'attente 15 jours";
export const SESSION_WAITING_QUEUE_DESCRIPTION =
  "Modifie la période bloquée de l'agenda session (6 ou 15 jours).";
export const SESSION_WAITING_QUEUE_TOGGLE = "Activer la file d'attente 15 jours";
export const SESSION_WAITING_QUEUE_ON =
  "Mode file d'attente actif — l'agenda affichera « File d'attente 15 jours » et grisera 15 jours.";
export const SESSION_WAITING_QUEUE_OFF =
  "Mode normal — l'agenda grise les 6 premiers jours selon le délai standard.";

export const SESSION_PREPARATION_TITLE = "Notes de préparation";
export const SESSION_PREPARATION_DESCRIPTION =
  "Espace libre pour préparer la session client. Enregistré localement en JSON.";
export const SESSION_PREPARATION_SAVE_CTA = "Enregistrer";
export const SESSION_PREPARATION_SAVE_SUCCESS = "Notes enregistrées.";
export const SESSION_PREPARATION_SAVE_ERROR = "Enregistrement impossible. Réessayez.";
export const SESSION_PREPARATION_LOAD_ERROR = "Chargement des réglages impossible.";

export const ONBOARDING_PARCOURS_LABEL = "Parcours";
export const ONBOARDING_PARCOURS_CAPTION = "Parcours onboarding — contenu à venir.";
export const ONBOARDING_PARCOURS_LEAF_TITLE = "Parcours onboarding";

export const DASHBOARD_KPIS_CAPTION = "KPIs parcours — à venir.";
export const DASHBOARD_KPIS_PLACEHOLDER =
  "KPIs parcours à venir — conversion découverte → audit → réservation";

export const LANDING_DESCRIPTION =
  "Cockpit interne — sélectionnez une audience pour accéder aux onglets Session, Onboarding, Dashboard, CVG et Emails.";

export const WELCOME_SCRIPT_TITLE = "Script d'accueil";

/** Breadcrumb labels for URL segments not in the nav tree. */
export const SEGMENT_LABELS: Record<string, string> = {
  funnel: SESSION_MODULE_LABEL,
  settings: "Réglages",
};

/** Builder / parcours JSON editor copy */
export const PARCOURS_PUBLISHED_MAX_HINT = "Briefs JSON locaux — 1 parcours publié max par dossier.";
export const PARCOURS_EMPTY_TITLE = "Aucun parcours";
export const PARCOURS_EMPTY_DESCRIPTION =
  "Créez un parcours pour documenter le parcours. Cursor implémentera les pages";
export const PARCOURS_NEW_CTA = "Nouveau parcours";
export const PARCOURS_NEW_DIALOG_TITLE = "Nouveau parcours";
export const PARCOURS_NEW_DIALOG_DESCRIPTION =
  "Nom obligatoire. Laissez vide pour utiliser my_funnel_N automatiquement.";
export const PARCOURS_NAME_LABEL = "Nom du parcours";
export const PARCOURS_NOT_FOUND = "Parcours introuvable";
export const PARCOURS_MAP_STEPS_FIRST = "Mappez d'abord les étapes du parcours.";
export const PARCOURS_DELETE_WARNING =
  "Cette action est irréversible. Le dossier JSON local du parcours sera supprimé définitivement.";
export const PARCOURS_LAYOUT_THEME_HINT =
  "Le thème global n'est pas personnalisable par parcours.";
export const PARCOURS_ALREADY_LIVE = "Ce parcours est déjà en live";
