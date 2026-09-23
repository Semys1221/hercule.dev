from __future__ import annotations

import unittest

from conference_clients.campaigns import classify_campaign_name
from conference_clients.select import (
    apply_selection_overrides,
    dedupe,
    email_domain,
    replace_failed_logos,
    resolve_website,
    select_from_export,
    split_by_category,
)


def _row(
    *,
    email: str,
    category: str,
    company: str = "",
    website: str = "",
) -> dict:
    return {
        "email": email,
        "category": category,
        "company_name": company,
        "website": website,
        "campaign_id": "c1",
        "campaign_name": "test",
        "lead_id": email,
    }


class CampaignClassifyTests(unittest.TestCase):
    def test_dec_and_cif_only(self) -> None:
        self.assertEqual(classify_campaign_name("DEC"), "accounting")
        self.assertEqual(classify_campaign_name("🧚‍♂️ DEC"), "accounting")
        self.assertEqual(classify_campaign_name("CIF"), "brokerage")
        self.assertEqual(classify_campaign_name("🧚‍♂️ CIF"), "brokerage")

    def test_skipped_lookalikes(self) -> None:
        self.assertIsNone(classify_campaign_name("🧚‍♂️ IAS"))
        self.assertIsNone(classify_campaign_name("Médecins (CIF)"))
        self.assertIsNone(classify_campaign_name("Dentistes (CIF)"))
        self.assertIsNone(classify_campaign_name("Restaurants (DCE)"))
        self.assertIsNone(classify_campaign_name("BTP (DCE)"))
        self.assertIsNone(classify_campaign_name("Expertise Comptable"))
        self.assertIsNone(classify_campaign_name("Kiné Paris"))


class DomainTests(unittest.TestCase):
    def test_email_domain_skips_freemail(self) -> None:
        self.assertIsNone(email_domain("jean@gmail.com"))
        self.assertIsNone(email_domain("jean@orange.fr"))
        self.assertEqual(email_domain("contact@cabinet-dupont.fr"), "cabinet-dupont.fr")

    def test_website_from_email_when_missing(self) -> None:
        self.assertEqual(
            resolve_website(_row(email="a@petit-cex.fr", category="accounting")),
            "https://petit-cex.fr",
        )
        self.assertIsNone(resolve_website(_row(email="a@gmail.com", category="accounting")))

    def test_website_field_wins(self) -> None:
        self.assertEqual(
            resolve_website(
                _row(
                    email="a@gmail.com",
                    category="accounting",
                    website="www.cabinet-local.fr",
                )
            ),
            "https://cabinet-local.fr",
        )


class SelectTests(unittest.TestCase):
    def test_denylist(self) -> None:
        split = select_from_export(
            [
                _row(
                    email="x@fiducial.fr",
                    category="accounting",
                    company="Fiducial Expertise",
                    website="https://www.fiducial.fr",
                ),
                _row(
                    email="y@petit.fr",
                    category="accounting",
                    company="Cabinet Petit",
                    website="https://petit.fr",
                ),
            ]
        )
        self.assertEqual(split["rejected_denied"], 1)
        self.assertEqual(len(split["chosen"]), 1)
        self.assertEqual(split["chosen"][0]["domain"], "petit.fr")

    def test_dedupe_email_and_domain(self) -> None:
        rows = [
            _row(email="a@dupont.fr", category="accounting", website="https://dupont.fr"),
            _row(email="a@dupont.fr", category="accounting", website="https://dupont.fr"),
            _row(email="b@dupont.fr", category="accounting", website="https://www.dupont.fr"),
        ]
        unique = dedupe(
            [
                {
                    "email": r["email"],
                    "domain": "dupont.fr",
                    "category": "accounting",
                    "name": "Dupont",
                    "website": "https://dupont.fr",
                    "slug": "dupont-fr",
                }
                for r in rows
            ]
        )
        self.assertEqual(len(unique), 1)

    def test_quota_15_plus_15_and_pool(self) -> None:
        rows = [
            _row(
                email=f"a{i}@acc{i}.fr",
                category="accounting",
                company=f"Acc {i}",
                website=f"https://acc{i}.fr",
            )
            for i in range(20)
        ] + [
            _row(
                email=f"b{i}@bro{i}.fr",
                category="brokerage",
                company=f"Bro {i}",
                website=f"https://bro{i}.fr",
            )
            for i in range(18)
        ]
        split = select_from_export(rows)
        chosen_acc = [c for c in split["chosen"] if c["category"] == "accounting"]
        chosen_bro = [c for c in split["chosen"] if c["category"] == "brokerage"]
        self.assertEqual(len(chosen_acc), 16)
        self.assertEqual(len(chosen_bro), 16)
        self.assertEqual(split["quotas"]["accounting_available"], 20)
        self.assertEqual(split["quotas"]["brokerage_available"], 18)
        self.assertEqual(len(split["pool"]), 6)

    def test_include_exclude_overrides(self) -> None:
        candidates = [
            {
                "email": "a@one.fr",
                "domain": "one.fr",
                "category": "accounting",
                "name": "One",
                "website": "https://one.fr",
                "slug": "one-fr",
            },
            {
                "email": "b@two.fr",
                "domain": "two.fr",
                "category": "accounting",
                "name": "Two",
                "website": "https://two.fr",
                "slug": "two-fr",
            },
        ]
        ordered = apply_selection_overrides(
            candidates,
            include_domains=["two.fr"],
            exclude_domains=["one.fr"],
        )
        self.assertEqual([c["domain"] for c in ordered], ["two.fr"])

    def test_replace_failed_logos_from_pool(self) -> None:
        chosen = [
            {
                "domain": "fail.fr",
                "category": "accounting",
                "name": "Fail",
                "website": "https://fail.fr",
                "slug": "fail-fr",
                "email": "a@fail.fr",
            }
        ]
        pool = [
            {
                "domain": "ok.fr",
                "category": "accounting",
                "name": "Ok",
                "website": "https://ok.fr",
                "slug": "ok-fr",
                "email": "a@ok.fr",
            }
        ]
        next_chosen, remaining, dropped = replace_failed_logos(chosen, pool, {"fail.fr"})
        self.assertEqual(next_chosen[0]["domain"], "ok.fr")
        self.assertEqual(remaining, [])
        self.assertEqual(dropped[0]["domain"], "fail.fr")

    def test_split_under_quota(self) -> None:
        candidates = [
            {
                "email": "a@a.fr",
                "domain": "a.fr",
                "category": "accounting",
                "name": "A",
                "website": "https://a.fr",
                "slug": "a-fr",
            }
        ]
        split = split_by_category(candidates)
        self.assertEqual(split["quotas"]["accounting"], 1)
        self.assertEqual(split["quotas"]["brokerage"], 0)


class LogoPickTests(unittest.TestCase):
    def test_picks_header_logo_not_og_image(self) -> None:
        from conference_clients.logos import pick_logo_url

        html = """
        <html><head>
          <meta property="og:image" content="https://ex.fr/photo-dirigeant.jpg">
        </head>
        <body>
          <header>
            <img class="site-logo" src="/assets/logo.png" alt="Cabinet">
          </header>
          <img src="/photo-locaux.jpg" alt="Locaux">
        </body></html>
        """
        self.assertEqual(
            pick_logo_url(html, "https://ex.fr/"),
            "https://ex.fr/assets/logo.png",
        )


if __name__ == "__main__":
    unittest.main()
