"""Tests for legal_content."""

from __future__ import annotations

import unittest
from pathlib import Path

from legal_content import (
    build_knowledge_pack_cached,
    build_legal_knowledge_markdown,
    extract_entreprise_faq,
    get_ai_reply_knowledge_markdown,
)


class LegalContentTests(unittest.TestCase):
    REQUIRED_ANCHORS = [
        "1 489 €",
        "14 jours ouvrés",
        "contact@hercule.dev",
        "Vercel",
        "CNIL",
        "Conditions Générales de Vente",
        "Mentions légales",
        "Politique de confidentialité",
    ]

    AI_REPLY_ANCHORS = [
        "1 489 €",
        "contact@hercule.dev",
        "100 % gratuit",
        "should_reply=false",
    ]

    def test_build_legal_knowledge_markdown_contains_required_anchors(self) -> None:
        bundle = build_legal_knowledge_markdown()
        for anchor in self.REQUIRED_ANCHORS:
            with self.subTest(anchor=anchor):
                self.assertIn(anchor, bundle)

    def test_seller_legal_uses_entreprise_cvg(self) -> None:
        bundle = build_legal_knowledge_markdown(audience="seller")
        self.assertIn("gratuit", bundle.lower())
        self.assertNotIn("Renouvellement typique", bundle)

    def test_ai_reply_knowledge_is_condensed(self) -> None:
        bundle = get_ai_reply_knowledge_markdown()
        self.assertLess(len(bundle), 5000)
        for anchor in self.AI_REPLY_ANCHORS:
            with self.subTest(anchor=anchor):
                self.assertIn(anchor, bundle)

    def test_extract_entreprise_faq_parses_table_rows(self) -> None:
        sample = """
### Questions entreprise

| # | Question | Réponse |
|---|----------|---------|
| E1 | Gratuit ? | Oui. |
| E2 | Commission ? | Non. |

---

## Next
"""
        faq = extract_entreprise_faq(sample)
        self.assertIn("Q: Gratuit ?", faq)
        self.assertIn("A: Oui.", faq)
        self.assertIn("Q: Commission ?", faq)

    def test_build_knowledge_pack_cached_succeeds(self) -> None:
        pack = build_knowledge_pack_cached(
            "biggy_agency",
            "buyer",
            "Agences web",
            "5-50",
        )
        self.assertIn("Knowledge pack", pack)
        self.assertIn("biggy_agency", pack)
        self.assertIn("1 489 €", pack)

    def test_build_knowledge_pack_comptable_preset(self) -> None:
        pack = build_knowledge_pack_cached(
            "cabinets_expertise_comptable",
            "buyer",
            "Cabinets expertise comptable",
            ">3",
        )
        self.assertIn("cvg/comptable", pack)
        self.assertIn("5 remplacements", pack)
        self.assertIn("cabinet EC (Buyer)", pack)
        reply_safe = pack.split("## Reply-safe facts (condensed)", 1)[1]
        self.assertIn("Hercule Comptable", reply_safe)
        self.assertNotIn("Starter 1 489", reply_safe)
        for anchor in (
            "Nanguy Evan Gbeho",
            "entrepreneur individuel",
            "885 248 039",
            "Qui êtes-vous ? De quelle structure dépendez-vous ?",
            "bande passante",
            "visioconférences",
            "Je n'ai pas 3 collaborateurs",
            "Rémunérez-vous les apporteurs",
        ):
            with self.subTest(anchor=anchor):
                self.assertIn(anchor, pack)

    def test_comptable_ai_reply_knowledge_includes_bandwidth(self) -> None:
        bundle = get_ai_reply_knowledge_markdown(audience="comptable")
        self.assertIn("bande passante", bundle.lower())
        self.assertIn("visio", bundle.lower())

    def test_build_knowledge_pack_cif_preset(self) -> None:
        pack = build_knowledge_pack_cached(
            "conseillers_gestion_patrimoine",
            "buyer",
            "CGP France",
            "2+",
        )
        self.assertIn("cvg/conseil-financier", pack)
        self.assertIn("cabinet CIF (Buyer)", pack)
        self.assertIn("minimum 2", pack)
        self.assertNotIn("plus de 3", pack)
        reply_safe = pack.split("## Reply-safe facts (condensed)", 1)[1]
        self.assertIn("Hercule CIF", reply_safe)
        for anchor in (
            "bande passante",
            "visioconférence",
            "Je n'ai pas 2 collaborateurs",
            "Rémunérez-vous les apporteurs",
        ):
            with self.subTest(anchor=anchor):
                self.assertIn(anchor, pack)

    def test_cif_buyer_prompt_covers_objections(self) -> None:
        prompt_path = (
            Path(__file__).resolve().parent
            / "prompts"
            / "conseillers_gestion_patrimoine_buyer.md"
        )
        body = prompt_path.read_text(encoding="utf-8").lower()
        for anchor in (
            "reservation_cif_link",
            "optimisation fiscale",
            "bande passante",
            "cvg/conseil-financier",
        ):
            with self.subTest(anchor=anchor):
                self.assertIn(anchor, body)

    def test_comptable_buyer_prompt_covers_objections(self) -> None:
        prompt_path = (
            Path(__file__).resolve().parent
            / "prompts"
            / "cabinets_expertise_comptable_buyer.md"
        )
        body = prompt_path.read_text(encoding="utf-8").lower()
        for anchor in (
            "bande passante",
            "visioconférence",
            "sous-traitance",
            "apporteur",
            "à quelles heures",
        ):
            with self.subTest(anchor=anchor):
                self.assertIn(anchor, body)


if __name__ == "__main__":
    unittest.main()
