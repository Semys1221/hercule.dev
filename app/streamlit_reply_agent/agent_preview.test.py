"""Tests for agent_preview prompt assembly."""

from __future__ import annotations

import unittest
from unittest.mock import patch

from pathlib import Path

from agent_preview import (
    DEFAULT_GROK_TEMPERATURE,
    assemble_system_prompt,
    build_global_rules,
    build_knowledge_pack,
    generate_reply_preview,
    grok_temperature,
    truncate_inbound_text,
)

_PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"


class BuildGlobalRulesTests(unittest.TestCase):
    def test_single_sentence(self) -> None:
        rules = build_global_rules(max_sentences=1)
        self.assertIn(
            "Maximum 1 phrase courte dans reply_text (hors signature et lien CTA).",
            rules,
        )

    def test_multiple_sentences(self) -> None:
        rules = build_global_rules(max_sentences=5)
        self.assertIn(
            "Maximum 5 phrases courtes dans reply_text (hors signature et lien CTA).",
            rules,
        )

    def test_clamps_above_ten(self) -> None:
        rules = build_global_rules(max_sentences=99)
        self.assertIn(
            "Maximum 10 phrases courtes dans reply_text (hors signature et lien CTA).",
            rules,
        )

    def test_clamps_below_one(self) -> None:
        rules = build_global_rules(max_sentences=0)
        self.assertIn(
            "Maximum 1 phrase courte dans reply_text (hors signature et lien CTA).",
            rules,
        )

    def test_requires_french_reply_text(self) -> None:
        rules = build_global_rules(max_sentences=2)
        self.assertIn("Rédige reply_text en français", rules)

    def test_includes_tone_anti_patterns(self) -> None:
        rules = build_global_rules(max_sentences=2)
        self.assertIn("pas d'urgence artificielle", rules)
        self.assertIn("Merci pour votre message", rules)
        self.assertNotIn("CTA urgent", rules)
        self.assertNotIn("accuser réception →", rules)

    def test_skips_not_interested_tag(self) -> None:
        rules = build_global_rules(max_sentences=2)
        self.assertIn("Not interested", rules)
        self.assertIn("should_reply à false", rules)


class GrokTemperatureTests(unittest.TestCase):
    def test_defaults_to_half(self) -> None:
        with patch.dict("os.environ", {"GROK_TEMPERATURE": ""}):
            self.assertEqual(grok_temperature(), DEFAULT_GROK_TEMPERATURE)

    def test_clamps_invalid_values(self) -> None:
        with patch.dict("os.environ", {"GROK_TEMPERATURE": "bad"}):
            self.assertEqual(grok_temperature(), DEFAULT_GROK_TEMPERATURE)


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
        self.assertIn(
            "Maximum 3 phrases courtes dans reply_text (hors signature et lien CTA).",
            prompt,
        )

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

    @patch("agent_preview.build_knowledge_pack", return_value="KNOWLEDGE")
    def test_includes_booking_context_when_provided(self, _mock_knowledge: object) -> None:
        prompt = assemble_system_prompt(
            self.config,
            "Campaign body",
            booking_context="Un rendez-vous Calendly a été créé automatiquement.",
        )
        self.assertIn("## Contexte Calendly (ne pas inventer)", prompt)
        self.assertIn("créé automatiquement", prompt)

    def test_comptable_system_prompt_includes_bandwidth_guidance(self) -> None:
        config = {
            "niche_preset_id": "cabinets_expertise_comptable",
            "target_type": "buyer",
            "niche_metadata": {
                "angle": "Cabinets expertise comptable",
                "effectif_cible": ">3",
            },
        }
        buyer_prompt = (
            _PROMPTS_DIR / "cabinets_expertise_comptable_buyer.md"
        ).read_text(encoding="utf-8")
        prompt = assemble_system_prompt(config, buyer_prompt, max_sentences=3)
        lower = prompt.lower()
        self.assertIn("bande passante", lower)
        self.assertIn("visioconférence", lower)
        self.assertIn("je n'ai pas 3 collaborateurs", lower)


class TruncateInboundTests(unittest.TestCase):
    def test_short_text_unchanged(self) -> None:
        self.assertEqual(truncate_inbound_text("Hello"), "Hello")

    def test_long_text_truncated(self) -> None:
        long_text = "x" * 3000
        result = truncate_inbound_text(long_text, max_chars=2000)
        self.assertEqual(len(result), 2000)
        self.assertTrue(result.endswith("…"))


class GenerateReplyPreviewTests(unittest.TestCase):
    def test_skips_not_interested_without_calling_grok(self) -> None:
        config = {
            "prompt_snapshot": "Campaign prompt",
            "target_type": "buyer",
            "niche_preset_id": "comptables",
        }
        with patch("agent_preview._generate_with_models") as mock_grok:
            preview = generate_reply_preview(
                config,
                "Hello",
                "lead@example.com",
                interest_label="Not interested",
            )
        mock_grok.assert_not_called()
        self.assertFalse(preview["should_reply"])
        self.assertIn("Not interested", preview["reason"])

    def test_jomega_collaborator_objection_reply_preview(self) -> None:
        config = {
            "prompt_snapshot": (
                _PROMPTS_DIR / "cabinets_expertise_comptable_buyer.md"
            ).read_text(encoding="utf-8"),
            "target_type": "buyer",
            "niche_preset_id": "cabinets_expertise_comptable",
            "niche_metadata": {},
            "max_sentences": 3,
        }
        inbound = (
            "Je n'ai pas 3 collaborateurs. Nous sommes 2 associés avec une partie "
            "sous-traités à un ami qui a aussi son cabinet. "
            "C'est donc problématique d'après ce que vous me dites.."
        )
        decision = {
            "should_reply": True,
            "reply_text": (
                "Merci pour votre message. L'enjeu est la bande passante pour "
                "intégrer des visioconférences qualifiantes, pas des appels de "
                "10 minutes, tout en assurant la production comptable.\n\n"
                "https://www.hercule.dev/reservation-entreprise.html/test\n\n"
                "Béatrice Meyer\nhercule.dev"
            ),
            "reason": "Objection éligibilité couverte par le pack connaissances.",
        }
        reserve = "https://www.hercule.dev/reservation-entreprise.html/test"
        links = {
            "primary": reserve,
            "agence_link": reserve,
            "entreprise_link": reserve,
            "comptable_link": reserve,
        }
        with (
            patch(
                "agent_preview._generate_with_models",
                return_value=(decision, "grok-test", None),
            ),
            patch("agent_preview.resolve_prompt_links", return_value=links),
        ):
            preview = generate_reply_preview(
                config,
                inbound,
                "jomega.expertise@gmail.com",
                interest_label="Interested",
            )
        self.assertTrue(preview["should_reply"])
        self.assertIn("bande passante", (preview.get("reply_text") or "").lower())
        pack = build_knowledge_pack(config)
        self.assertIn("bande passante", pack.lower())


if __name__ == "__main__":
    unittest.main()
