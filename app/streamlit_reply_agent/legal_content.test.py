"""Tests for legal_content."""

from __future__ import annotations

import unittest

from legal_content import build_legal_knowledge_markdown


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

    def test_build_legal_knowledge_markdown_contains_required_anchors(self) -> None:
        bundle = build_legal_knowledge_markdown()
        for anchor in self.REQUIRED_ANCHORS:
            with self.subTest(anchor=anchor):
                self.assertIn(anchor, bundle)


if __name__ == "__main__":
    unittest.main()
