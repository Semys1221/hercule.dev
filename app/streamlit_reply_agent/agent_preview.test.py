"""Tests for agent_preview prompt assembly."""

from __future__ import annotations

import unittest
from unittest.mock import patch

from agent_preview import (
    assemble_system_prompt,
    build_global_rules,
    truncate_inbound_text,
)


class BuildGlobalRulesTests(unittest.TestCase):
    def test_single_sentence(self) -> None:
        rules = build_global_rules(max_sentences=1)
        self.assertIn("Écris exactement 1 phrase dans reply_text.", rules)

    def test_multiple_sentences(self) -> None:
        rules = build_global_rules(max_sentences=5)
        self.assertIn("Écris exactement 5 phrases dans reply_text.", rules)

    def test_clamps_above_ten(self) -> None:
        rules = build_global_rules(max_sentences=99)
        self.assertIn("Écris exactement 10 phrases dans reply_text.", rules)

    def test_clamps_below_one(self) -> None:
        rules = build_global_rules(max_sentences=0)
        self.assertIn("Écris exactement 1 phrase dans reply_text.", rules)

    def test_requires_french_reply_text(self) -> None:
        rules = build_global_rules(max_sentences=2)
        self.assertIn("Rédige reply_text en français.", rules)


class AssembleSystemPromptTests(unittest.TestCase):
    def setUp(self) -> None:
        self.config = {
            "niche_preset_id": "comptables",
            "target_type": "buyer",
            "niche_metadata": {"angle": "Comptables", "effectif_cible": "5-20"},
        }

    @patch("agent_preview.build_knowledge_pack", return_value="KNOWLEDGE")
    def test_includes_knowledge_and_campaign(self, _mock_knowledge: object) -> None:
        prompt = assemble_system_prompt(
            self.config,
            "Campaign body",
            max_sentences=3,
        )
        self.assertIn("## Pack de connaissances", prompt)
        self.assertIn("KNOWLEDGE", prompt)
        self.assertIn("## Prompt campagne", prompt)
        self.assertIn("Campaign body", prompt)
        self.assertIn("Écris exactement 3 phrases dans reply_text.", prompt)

    @patch("agent_preview.build_knowledge_pack", return_value="KNOWLEDGE")
    def test_includes_custom_directive_when_provided(self, _mock_knowledge: object) -> None:
        prompt = assemble_system_prompt(
            self.config,
            "Campaign body",
            custom_directive="Be more direct.",
        )
        self.assertIn("## Directive custom (opérateur)", prompt)
        self.assertIn("Be more direct.", prompt)

    @patch("agent_preview.build_knowledge_pack", return_value="KNOWLEDGE")
    def test_omits_empty_custom_directive(self, _mock_knowledge: object) -> None:
        prompt = assemble_system_prompt(
            self.config,
            "Campaign body",
            custom_directive="   ",
        )
        self.assertNotIn("## Directive custom (opérateur)", prompt)


class TruncateInboundTests(unittest.TestCase):
    def test_short_text_unchanged(self) -> None:
        self.assertEqual(truncate_inbound_text("Hello"), "Hello")

    def test_long_text_truncated(self) -> None:
        long_text = "x" * 3000
        result = truncate_inbound_text(long_text, max_chars=2000)
        self.assertEqual(len(result), 2000)
        self.assertTrue(result.endswith("…"))


if __name__ == "__main__":
    unittest.main()
