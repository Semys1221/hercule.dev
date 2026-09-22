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
        text: "On fait notre comptabilité, mais on manque surtout de visibilité sur nos marges et notre rentabilité.",
      },
      {
        speaker: "hercule",
        text: "D’accord. Vous cherchez donc plutôt un accompagnement pour piloter l’activité au-delà de la simple comptabilité ?",
      },
      {
        speaker: "entrepreneur",
        text: "Oui, exactement.",
      },
      {
        speaker: "hercule",
        text: "Et votre établissement est actuellement suffisamment rentable pour envisager un accompagnement de ce type ?",
      },
      {
        speaker: "entrepreneur",
        text: "Oui, nous avons une activité stable et les moyens de mettre en place un véritable suivi.",
      },
      {
        speaker: "hercule",
        text: VISIO_CLOSE,
        highlights: ["7 décembre à 10h"],
      },
      {
        speaker: "entrepreneur",
        text: "Est-ce que lundi à 13h est possible ?",
        highlights: ["lundi à 13h"],
      },
    ],
    verdict: "Prospect qualifié : restaurant solvable + besoin de pilotage financier.",
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
        text: "Oui. Nous avons notamment notre responsabilité civile professionnelle et nos locaux à assurer.",
      },
      {
        speaker: "hercule",
        text: "D’accord. Et au niveau de votre trésorerie, vous disposez actuellement de plus de 50 000 € ?",
        highlights: ["50 000 €"],
      },
      {
        speaker: "entrepreneur",
        text: "Oui, nous avons environ 80 000 € de trésorerie.",
        highlights: ["80 000 €"],
      },
      {
        speaker: "hercule",
        text: "Très bien. Est-ce que vos contrats actuels ont été réévalués récemment ?",
      },
      {
        speaker: "entrepreneur",
        text: "Non, pas vraiment. Notre activité a beaucoup évolué depuis leur mise en place.",
      },
      {
        speaker: "hercule",
        text: "Vous seriez donc ouvert à faire le point sur vos garanties et à voir si votre couverture actuelle est toujours adaptée ?",
      },
      {
        speaker: "entrepreneur",
        text: "Oui, tout à fait.",
      },
      {
        speaker: "hercule",
        text: VISIO_CLOSE,
        highlights: ["7 décembre à 10h"],
      },
      {
        speaker: "entrepreneur",
        text: "Oui, quel est le lien de la visio ?",
        highlights: ["lien de la visio"],
      },
    ],
    verdict: "Prospect qualifié : trésorerie ≥ 50 k€ + besoin d’assurance identifié.",
  },
  {
    niche: "CIF",
    lines: [
      {
        speaker: "hercule",
        text: "Bonjour, pour bien comprendre votre situation, est-ce que vous avez actuellement une partie de votre trésorerie que vous envisagez de placer ?",
      },
      {
        speaker: "entrepreneur",
        text: "Oui, j’ai environ 100 000 € disponibles et je réfléchis justement à différents placements.",
        highlights: ["100 000 €"],
      },
      {
        speaker: "hercule",
        text: "D’accord. Vous avez donc déjà un montant disponible et un projet de placement identifié ?",
      },
      {
        speaker: "entrepreneur",
        text: "Oui, je cherche surtout à savoir quelles solutions seraient adaptées.",
      },
      {
        speaker: "hercule",
        text: "Très bien. Vous souhaitez donc être accompagné pour étudier les différentes possibilités avant de prendre une décision ?",
      },
      {
        speaker: "entrepreneur",
        text: "Oui, exactement.",
      },
      {
        speaker: "hercule",
        text: VISIO_CLOSE,
        highlights: ["7 décembre à 10h"],
      },
      {
        speaker: "entrepreneur",
        text: "Est-ce que lundi à 13h est possible ?",
        highlights: ["lundi à 13h"],
      },
    ],
    verdict: "Prospect qualifié : trésorerie ≥ 50 k€ + projet de placement identifié.",
  },
];

/** Beats per niche = dialogue lines + 1 verdict beat. */
export const NICHE_BEAT_COUNTS = SCRIPTS.map((s) => s.lines.length + 1);

export const S09_QUAL_BEAT_COUNT = NICHE_BEAT_COUNTS.reduce((a, b) => a + b, 0);

/** Last step of the qualification chats (inclusive). */
export const S09_QUAL_END = S09_QUAL_START + S09_QUAL_BEAT_COUNT - 1;

/** Logo + timeline after all three chats. */
export const S09_LOGO_STEP = S09_QUAL_END + 1;

/** S09 step when the CIF visio line is shown. */
export const S09_CIF_VISIO_STEP =
  S09_QUAL_START +
  NICHE_BEAT_COUNTS[0] +
  NICHE_BEAT_COUNTS[1] +
  SCRIPTS[2].lines.length -
  2;

/** Total S09 steps (0-indexed count). */
export const S09_STEP_COUNT = S09_LOGO_STEP + 1;

export type NicheCardView = {
  niche: Niche;
  lines: QualificationLine[];
  verdict: string | null;
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
        dimmed: finished,
      });
    }

    offset += beatCount;
  }

  return { cards, activeIndex };
}
