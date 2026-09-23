export const NICHES = ["DEC", "IAS", "CIF"] as const;

export type Niche = (typeof NICHES)[number];

export type Speaker = "hercule" | "entrepreneur";

export type QualificationLine = {
  speaker: Speaker;
  text: string;
  /** Substrings to highlight inline in the dialogue bubble. */
  highlights?: string[];
};

export type NicheScript = {
  niche: Niche;
  lines: QualificationLine[];
  verdict: string;
  verdictHighlights?: string[];
  stamp?: string;
};

/** First S09 step of the sequential qualification chats. */
export const S09_QUAL_START = 9;

const VISIO_CLOSE =
  "Seriez-vous disponible le 7 décembre à 10h pour un entretien en visio ?";

export const SCRIPTS: NicheScript[] = [
  {
    niche: "DEC",
    lines: [
      {
        speaker: "hercule",
        text: "Bonjour, pour bien comprendre votre situation, comment se passe aujourd’hui le suivi financier de votre restaurant ?",
      },
      {
        speaker: "entrepreneur",
        text: "La compta tourne. Par contre on n’a pas de pilotage des marges, et c’est ça qu’on veut mettre en place.",
      },
      {
        speaker: "hercule",
        text: "D’accord. Vous cherchez donc plutôt un accompagnement pour piloter l’activité au-delà de la simple comptabilité ?",
      },
      {
        speaker: "entrepreneur",
        text: "Oui. On veut quelqu’un qui pilote avec nous, pas un prestataire de plus.",
      },
      {
        speaker: "hercule",
        text: "Un accompagnement à 300 € par mois minimum, est-ce acceptable pour vous ?",
        highlights: ["300 €"],
      },
      {
        speaker: "entrepreneur",
        text: "Si le ROI est démontré, c’est ce que nous recherchons.",
        highlights: ["ROI"],
      },
      {
        speaker: "hercule",
        text: VISIO_CLOSE,
        highlights: ["7 décembre à 10h"],
      },
      {
        speaker: "entrepreneur",
        text: "Le 7 à 10h, je ne peux pas. Est-ce que lundi à 13h est possible ?",
        highlights: ["lundi à 13h"],
      },
    ],
    verdict: "Prospect qualifié : restaurant solvable + besoin de pilotage financier.",
    verdictHighlights: ["restaurant solvable", "besoin de pilotage financier"],
    stamp: "Solvabilité & Intérêt",
  },
  {
    niche: "IAS",
    lines: [
      {
        speaker: "hercule",
        text: "Bonjour, pour bien comprendre votre situation, est-ce que vous avez actuellement des besoins en assurance pour votre entreprise ?",
      },
      {
        speaker: "entrepreneur",
        text: "Oui. RC pro et locaux. L’activité a changé, il faut remettre les contrats à niveau.",
      },
      {
        speaker: "hercule",
        text: "D’accord. Et au niveau de votre trésorerie, vous disposez actuellement de plus de 50 000 € ?",
        highlights: ["50 000 €"],
      },
      {
        speaker: "entrepreneur",
        text: "Oui. On est autour de 80 000 €, on peut avancer.",
        highlights: ["80 000 €"],
      },
      {
        speaker: "hercule",
        text: "Très bien. Est-ce que vos contrats actuels ont été réévalués récemment ?",
      },
      {
        speaker: "entrepreneur",
        text: "Non. Rien n’a été repris depuis, et ça ne correspond plus à ce qu’on fait.",
      },
      {
        speaker: "hercule",
        text: "Vous seriez donc ouvert à faire le point sur vos garanties et à voir si votre couverture actuelle est toujours adaptée ?",
      },
      {
        speaker: "entrepreneur",
        text: "Oui. On veut des garanties à jour, pas un devis pour le principe.",
      },
      {
        speaker: "hercule",
        text: VISIO_CLOSE,
        highlights: ["7 décembre à 10h"],
      },
      {
        speaker: "entrepreneur",
        text: "D’accord pour le 7. Envoyez le lien de la visio, je prépare les contrats.",
        highlights: ["lien de la visio"],
      },
    ],
    verdict: "Prospect qualifié : trésorerie ≥ 50 k€ + besoin d’assurance identifié.",
    stamp: "Solvabilité & Intérêt",
  },
  {
    niche: "CIF",
    lines: [
      {
        speaker: "hercule",
        text: "Bonjour, pour bien comprendre votre situation, avez-vous une idée du montant d’impôt que vous payez ?",
      },
      {
        speaker: "entrepreneur",
        text: "Oui. On le voit chaque année, et on ne sait pas quoi en faire.",
      },
      {
        speaker: "hercule",
        text: "D’accord. Et au niveau de votre trésorerie, vous disposez d’un minimum de 50 000 € pour activer des leviers ?",
        highlights: ["50 000 €"],
      },
      {
        speaker: "entrepreneur",
        text: "Nous avons environ 100 000 €. Par contre, je veux une proposition sérieuse.",
        highlights: ["100 000 €", "proposition sérieuse"],
      },
      {
        speaker: "hercule",
        text: "Très bien. Vous souhaitez donc être accompagné pour étudier les leviers adaptés avant de prendre une décision ?",
      },
      {
        speaker: "entrepreneur",
        text: "Oui. Je veux être accompagné pour trancher.",
      },
      {
        speaker: "hercule",
        text: VISIO_CLOSE,
        highlights: ["7 décembre à 10h"],
      },
      {
        speaker: "entrepreneur",
        text: "Le 7 à 10h, je suis pris. Est-ce que lundi à 13h est possible ?",
        highlights: ["lundi à 13h"],
      },
    ],
    verdict: "Prospect qualifié : trésorerie ≥ 50 k€ + leviers identifiés.",
    stamp: "Solvabilité & Intérêt",
  },
];

/** Beats per niche = dialogue lines + 1 verdict beat. */
export const NICHE_BEAT_COUNTS = SCRIPTS.map((s) => s.lines.length + 1);

export const S09_QUAL_BEAT_COUNT = NICHE_BEAT_COUNTS.reduce((a, b) => a + b, 0);

/** Last step of the qualification chats (inclusive). */
export const S09_QUAL_END = S09_QUAL_START + S09_QUAL_BEAT_COUNT - 1;

/** Logo after all three chats. */
export const S09_LOGO_STEP = S09_QUAL_END + 1;

/** Courtage tagline fades in on the same lockup, then the client proofs. */
export const S09_COURTAGE_STEP = S09_LOGO_STEP + 1;

/** Total S09 steps (0-indexed count). */
export const S09_STEP_COUNT = S09_COURTAGE_STEP + 1;

export type NicheCardView = {
  niche: Niche;
  lines: QualificationLine[];
  verdict: string | null;
  verdictHighlights: string[];
  stamp: string | null;
  dimmed: boolean;
};

export type QualificationView = {
  cards: NicheCardView[];
  /** Index of the niche facing the audience (DEC, IAS, CIF). */
  activeIndex: number;
};

/**
 * Three niche cards for an S09 step during sequential qualification.
 * Null outside the qualification block. Future niches stay empty until their turn.
 */
export function qualificationView(step: number): QualificationView | null {
  if (step < S09_QUAL_START || step > S09_QUAL_END) return null;

  const local = step - S09_QUAL_START;
  const cards: NicheCardView[] = [];
  let offset = 0;
  let activeIndex = 0;

  for (let i = 0; i < SCRIPTS.length; i++) {
    const script = SCRIPTS[i];
    const beatCount = NICHE_BEAT_COUNTS[i];
    const nicheStart = offset;
    const nicheEnd = offset + beatCount - 1;

    if (local < nicheStart) {
      cards.push({
        niche: script.niche,
        lines: [],
        verdict: null,
        verdictHighlights: [],
        stamp: null,
        dimmed: false,
      });
    } else {
      const progress = local - nicheStart;
      const lineCount = Math.min(progress + 1, script.lines.length);
      const showVerdict = progress >= script.lines.length;
      const finished = local > nicheEnd;
      if (!finished) activeIndex = i;

      cards.push({
        niche: script.niche,
        lines: script.lines.slice(0, lineCount),
        verdict: showVerdict ? script.verdict : null,
        verdictHighlights: showVerdict ? (script.verdictHighlights ?? []) : [],
        stamp: showVerdict ? (script.stamp ?? null) : null,
        dimmed: showVerdict,
      });
    }

    offset += beatCount;
  }

  return { cards, activeIndex };
}
