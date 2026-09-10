"""Unit tests for Calendly↔Instantly sync helpers."""

from __future__ import annotations

import unittest

from instantly_match import (
    booking_match_emails,
    is_delivery_booking,
    normalize_website,
    should_patch_company,
)


class NormalizeWebsiteTests(unittest.TestCase):
    def test_adds_https_prefix(self) -> None:
        self.assertEqual(normalize_website("example.com"), "https://example.com")

    def test_preserves_existing_scheme(self) -> None:
        self.assertEqual(normalize_website("http://example.com"), "http://example.com")

    def test_rejects_empty(self) -> None:
        self.assertIsNone(normalize_website(""))
        self.assertIsNone(normalize_website("n/a"))

    def test_rejects_email_like_values(self) -> None:
        self.assertIsNone(normalize_website("user@example.com"))


class ShouldPatchCompanyTests(unittest.TestCase):
    def test_empty_company_allows_patch(self) -> None:
        allowed, reason = should_patch_company("", "https://acme.fr")
        self.assertTrue(allowed)
        self.assertEqual(reason, "empty_company")

    def test_url_company_allows_replace(self) -> None:
        allowed, reason = should_patch_company("www.old.fr", "https://new.fr")
        self.assertTrue(allowed)
        self.assertEqual(reason, "replace_url")

    def test_org_name_blocks_without_force(self) -> None:
        allowed, reason = should_patch_company("Cabinet Dupont", "https://dupont.fr")
        self.assertFalse(allowed)
        self.assertEqual(reason, "company_conflict")

    def test_force_overrides_conflict(self) -> None:
        allowed, reason = should_patch_company(
            "Cabinet Dupont",
            "https://dupont.fr",
            force=True,
        )
        self.assertTrue(allowed)
        self.assertEqual(reason, "force")


class DeliveryBookingTests(unittest.TestCase):
    def test_excludes_match_prefix(self) -> None:
        self.assertTrue(is_delivery_booking("match:uuid"))
        self.assertFalse(is_delivery_booking("slug-abc"))


class BookingEmailTests(unittest.TestCase):
    def test_collects_invitee_and_lead_email(self) -> None:
        emails = booking_match_emails(
            {"email": "invitee@example.com", "lead_email": "lead@example.com"},
        )
        self.assertEqual(emails, ["invitee@example.com", "lead@example.com"])


if __name__ == "__main__":
    unittest.main()
