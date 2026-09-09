"""Tests for lead_links CTA resolution and substitution."""

from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch

from lead_links import (
    apply_prompt_link_variables,
    fallback_cta_link,
    resolve_lead_cta_link,
)


class LeadLinksTests(unittest.TestCase):
    def test_fallback_buyer(self) -> None:
        with patch("lead_links._find_lead_by_email", return_value=(None, None)):
            self.assertEqual(
                resolve_lead_cta_link("x@y.com", "buyer"),
                fallback_cta_link("buyer"),
            )

    def test_resolve_from_supabase_row(self) -> None:
        url = "https://www.hercule.dev/reservation.html/slug99"
        with patch(
            "lead_links._find_lead_by_email",
            return_value=("agence", {"reservation_agence_link": url}),
        ):
            self.assertEqual(resolve_lead_cta_link("x@y.com", "buyer"), url)

    def test_resolve_comptable_buyer(self) -> None:
        url = "https://www.hercule.dev/r/comptable/slug99"
        with patch(
            "lead_links._find_lead_by_email",
            return_value=("comptable", {"reservation_comptable_link": url}),
        ):
            self.assertEqual(resolve_lead_cta_link("x@y.com", "buyer"), url)

    def test_apply_comptable_link_variable(self) -> None:
        url = "https://www.hercule.dev/r/comptable/slug99"
        prompt = "CTA: {reservation_comptable_link}"
        links = {
            "primary": url,
            "agence_link": "https://www.hercule.dev/reservation.html",
            "entreprise_link": "https://www.hercule.dev/reservation-entreprise.html",
            "comptable_link": url,
        }
        self.assertEqual(
            apply_prompt_link_variables(prompt, url, "buyer", links),
            f"CTA: {url}",
        )

    def test_apply_prompt_link_variables_buyer(self) -> None:
        url = "https://www.hercule.dev/reservation.html/abc"
        prompt = "CTA: {reservation_agence_link}"
        self.assertEqual(
            apply_prompt_link_variables(prompt, url, "buyer"),
            f"CTA: {url}",
        )

    def test_apply_prompt_link_variables_seller_double_brace(self) -> None:
        url = "https://www.hercule.dev/reservation-entreprise.html/xyz"
        prompt = "Book: {{reservation_entreprise_link}}"
        self.assertEqual(
            apply_prompt_link_variables(prompt, url, "seller"),
            f"Book: {url}",
        )


if __name__ == "__main__":
    unittest.main()
