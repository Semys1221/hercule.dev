"""Tests for legal_content."""

from __future__ import annotations

import unittest

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


if __name__ == "__main__":
    unittest.main()
