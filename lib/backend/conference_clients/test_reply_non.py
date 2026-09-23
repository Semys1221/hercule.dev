from __future__ import annotations

import unittest

from conference_clients.reply_non import is_non_reply, normalize_reply


class ReplyNonTests(unittest.TestCase):
    def test_plain_non(self) -> None:
        self.assertTrue(is_non_reply("non"))
        self.assertTrue(is_non_reply("Non."))
        self.assertTrue(is_non_reply("NON !"))
        self.assertTrue(is_non_reply("  Non  "))

    def test_non_merci(self) -> None:
        self.assertTrue(is_non_reply("non merci"))
        self.assertTrue(is_non_reply("Non, merci."))
        self.assertTrue(is_non_reply("Non merci beaucoup"))
        self.assertTrue(is_non_reply("non pas intéressé"))

    def test_rejects_yes_and_long_text(self) -> None:
        self.assertFalse(is_non_reply("oui"))
        self.assertFalse(is_non_reply("Oui merci"))
        self.assertFalse(
            is_non_reply(
                "Non, nous sommes déjà accompagnés par un cabinet et nous n'avons "
                "pas besoin de ce type de démarche commerciale pour le moment."
            )
        )
        self.assertFalse(is_non_reply(""))
        self.assertFalse(is_non_reply("non mais on peut en parler la semaine prochaine"))

    def test_normalize_strips_quotes_and_signature(self) -> None:
        body = "« Non »\n\nEnvoyé depuis mon iPhone"
        self.assertTrue(is_non_reply(body))
        self.assertEqual(normalize_reply(body).split()[0], "non")


if __name__ == "__main__":
    unittest.main()
