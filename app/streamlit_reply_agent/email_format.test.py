"""Tests for email_format HTML link and signature rules."""

from __future__ import annotations

import unittest

from email_format import (
    BEATRICE_SIGNATURE,
    ensure_beatrice_signature,
    format_reply_html,
    plain_text_to_html,
)


class EnsureBeatriceSignatureTests(unittest.TestCase):
    def test_appends_signature_and_site_link(self) -> None:
        result = ensure_beatrice_signature("Merci pour votre message.")
        self.assertIn(BEATRICE_SIGNATURE, result)
        self.assertIn("hercule.dev", result)
        self.assertLess(result.index(BEATRICE_SIGNATURE), result.index("hercule.dev"))

    def test_appends_site_link_after_existing_signature(self) -> None:
        body = f"Bonjour.\n\n{BEATRICE_SIGNATURE}"
        result = ensure_beatrice_signature(body)
        self.assertIn("https://hercule.dev", result)
        self.assertGreater(result.index(BEATRICE_SIGNATURE), 0)

    def test_keeps_existing_site_link_after_signature(self) -> None:
        body = f"Bonjour.\n\n{BEATRICE_SIGNATURE}\nhttps://hercule.dev/cvg"
        result = ensure_beatrice_signature(body)
        self.assertEqual(result.count("hercule.dev"), 1)


class FormatReplyHtmlTests(unittest.TestCase):
    def test_reservation_url_becomes_reserver_link(self) -> None:
        url = "https://www.hercule.dev/reservation.html/abc123"
        html_out = format_reply_html(
            f"Réservez ici : {url}\n\n{BEATRICE_SIGNATURE}\nhttps://hercule.dev",
        )
        self.assertIn(f'<a href="{url}">Réserver</a>', html_out)
        self.assertNotIn(f"Réservez ici : {url}", html_out)

    def test_hercule_site_url_becomes_hercule_dev_link(self) -> None:
        html_out = format_reply_html(
            f"Détails sur https://hercule.dev/cvg\n\n{BEATRICE_SIGNATURE}\nhttps://hercule.dev",
        )
        self.assertIn('<a href="https://hercule.dev/cvg">hercule.dev</a>', html_out)

    def test_adds_signature_when_missing(self) -> None:
        html_out = format_reply_html("Merci pour votre retour.")
        self.assertIn(BEATRICE_SIGNATURE, html_out)
        self.assertIn('<a href="https://hercule.dev">hercule.dev</a>', html_out)

    def test_escapes_html_in_body(self) -> None:
        html_out = format_reply_html("<script>alert(1)</script>")
        self.assertNotIn("<script>", html_out)
        self.assertIn("&lt;script&gt;", html_out)

    def test_appends_cta_when_missing(self) -> None:
        cta = "https://www.hercule.dev/reservation.html/slug"
        html_out = format_reply_html(
            "Merci.",
            cta_link=cta,
        )
        self.assertIn(f'<a href="{cta}">Réserver</a>', html_out)

    def test_entreprise_reservation_url(self) -> None:
        url = "https://www.hercule.dev/reservation-entreprise.html/xyz"
        html_out = format_reply_html(
            f"CTA: {url}\n\n{BEATRICE_SIGNATURE}\nhttps://hercule.dev",
        )
        self.assertIn(f'<a href="{url}">Réserver</a>', html_out)


class PlainTextToHtmlTests(unittest.TestCase):
    def test_wraps_paragraphs(self) -> None:
        html_out = plain_text_to_html("Line one\n\nLine two")
        self.assertIn("<p>Line one</p>", html_out)
        self.assertIn("<p>Line two</p>", html_out)


if __name__ == "__main__":
    unittest.main()
