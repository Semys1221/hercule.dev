"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { SceneShell } from "../shared/SceneShell";

type FaqItem = {
  question: string;
  answer: readonly string[];
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Les prospects sont-ils dans ma région ?",
    answer: [
      "Priorité régionale si pertinent",
      "France entière, en visio",
      "Volume compense la conversion",
    ],
  },
  {
    question: "Puis-je payer au mois ?",
    answer: [
      "Oui",
      "1 800 € / mois",
      "3 900 € / 3 mois",
    ],
  },
  {
    question: "Est-ce que je peux changer les questions posées ?",
    answer: [
      "Oui, vous pouvez changer les questions",
      "Objectif : une qualification selon vos critères",
    ],
  },
  {
    question: "Comment savoir si le profil est bien qualifié ?",
    answer: [
      "Trois validations cumulées",
      "Problème — douleur concrète, validée niche par niche",
      "Budget — plancher atteint avant transmission",
      "RDV — créneau réservé dans votre agenda connecté",
    ],
  },
  {
    question: "Pourquoi IAS et CIF sont dans la même offre ?",
    answer: [
      "Même plancher, deux métiers",
      "50 000 € minimum",
      "IAS : continuité (homme-clé, prévoyance)",
      "CIF : trésorerie (PER, SCPI, capitalisation)",
    ],
  },
];

/** Secondary beat, right after the monthly payment answer. */
const RETRACTION_STEP = 5;

/**
 * S15 — FAQ
 * Intro, puis chaque question suivie d’une slide réponse en puces.
 * Un beat secondaire de rétractation suit les options de paiement.
 */
export function S15_FAQ({ step }: SceneProps) {
  const isIntro = step === 0;
  const isRetraction = step === RETRACTION_STEP;
  const shifted = step > RETRACTION_STEP ? step - 1 : step;
  const isQuestion = !isIntro && !isRetraction && shifted % 2 === 1;
  const isAnswer = !isIntro && !isRetraction && shifted % 2 === 0;
  const itemIndex = isQuestion ? (shifted - 1) / 2 : isAnswer ? (shifted - 2) / 2 : -1;
  const item = itemIndex >= 0 ? FAQ_ITEMS[itemIndex] : null;

  return (
    <SceneShell>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`faq-${step}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="max-w-lg px-10 text-center"
        >
          {isIntro ? (
            <p className="text-3xl font-light tracking-[0.28em] uppercase text-zinc-400 leading-relaxed">
              QUESTIONS ?
            </p>
          ) : isRetraction ? (
            <p className="text-sm tracking-[0.22em] text-zinc-500 uppercase">
              4 jours de rétractation
            </p>
          ) : isAnswer && item ? (
            <ul className="mx-auto w-full max-w-md list-disc list-inside space-y-3 text-left text-lg font-light text-zinc-300 leading-relaxed">
              {item.answer.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : item ? (
            <p className="text-2xl font-light text-zinc-300 leading-relaxed">
              {item.question}
            </p>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </SceneShell>
  );
}
