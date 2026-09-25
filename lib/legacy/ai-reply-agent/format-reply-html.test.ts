/** Unit tests for format-reply-html link and signature rules. */

import assert from "node:assert/strict";

import {
  BEATRICE_SIGNATURE,
  ensureBeatriceSignature,
  formatReplyHtml,
  plainTextToHtml,
} from "@/lib/legacy/ai-reply-agent/format-reply-html";
function main() {
  {
    const result = ensureBeatriceSignature("Merci pour votre message.");
    assert.match(result, /Béatrice Meyer/);
    assert.match(result, /Hercule, Courtage contrat BNC\/BIC/);
    assert.doesNotMatch(result, /https:\/\/hercule\.dev/);
    assert.ok(result.indexOf("Béatrice Meyer") < result.indexOf("Hercule, Courtage"));
  }

  {
    const body = `Bonjour.\n\n${BEATRICE_SIGNATURE}`;
    const result = ensureBeatriceSignature(body);
    assert.match(result, /Hercule, Courtage contrat BNC\/BIC/);
    assert.doesNotMatch(result, /https:\/\/hercule\.dev/);
  }

  {
    const url = "https://www.hercule.dev/reservation.html/abc123";
    const html = formatReplyHtml(
      `Réservez ici : ${url}\n\n${BEATRICE_SIGNATURE}`,
    );
    assert.match(html, new RegExp(`<strong><a href="${url}">Réserver</a></strong>`));
    assert.doesNotMatch(html, new RegExp(`Réservez ici : ${url}`));
  }

  {
    const html = formatReplyHtml(
      `Détails sur https://hercule.dev/cvg\n\n${BEATRICE_SIGNATURE}`,
    );
    assert.match(html, /<a href="https:\/\/hercule\.dev\/cvg">hercule\.dev<\/a>/);
  }

  {
    const html = formatReplyHtml("Merci pour votre retour.");
    assert.match(html, /Béatrice Meyer/);
    assert.match(html, /Hercule, <i>Courtage contrat BNC\/BIC<\/i>/);
    assert.match(html, /<i>Répondez non si vous ne souhaitez plus de messages\.<\/i>/);
    assert.match(html, /Cordialement,/);
    assert.doesNotMatch(html, /<p>Béatrice Meyer<br\/>Hercule, Courtage[^<]*<br\/><a href="https:\/\/hercule\.dev">/);
  }

  {
    const html = formatReplyHtml("<script>alert(1)</script>");
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /&lt;script&gt;/);
  }

  {
    const cta = "https://www.hercule.dev/reservation.html/slug";
    const html = formatReplyHtml("Merci.", { ctaLink: cta });
    assert.match(html, new RegExp(`<strong><a href="${cta}">Réserver</a></strong>`));
  }

  {
    const html = plainTextToHtml("Line one\n\nLine two");
    assert.match(html, /<p>Line one<\/p>/);
    assert.match(html, /<p>Line two<\/p>/);
  }

  {
    const url = "https://www.hercule.dev/r/comptable/slug99";
    const html = formatReplyHtml(
      `Merci pour votre retour. Réservez ici : ${url} ${BEATRICE_SIGNATURE}`,
      { ctaLink: url },
    );
    assert.match(html, new RegExp(`<strong><a href="${url}">Réserver</a></strong>`));
    assert.ok((html.match(/<p>/g) ?? []).length > 1);
  }

  {
    const html = formatReplyHtml(
      `Je note votre confirmation positive.

Pour découvrir les flux qualifiés en cours et le format de collaboration n'hésitez pas à vous rendre sur notre site internet hercule.dev

${BEATRICE_SIGNATURE}`,
    );
    assert.match(
      html,
      /collaboration n'hésitez pas à vous rendre sur notre site internet <a href="https:\/\/hercule\.dev">hercule\.dev<\/a>/,
    );
    assert.match(html, /<p><i>Répondez non si vous ne souhaitez plus de messages\.<\/i><\/p>/);
    assert.match(html, /<p>Cordialement,<\/p>/);
    assert.match(html, /<p>Béatrice Meyer<br\/>Hercule, <i>Courtage contrat BNC\/BIC<\/i><\/p>/);
    assert.doesNotMatch(html, /hercule\.dev Courtage contrat BNC\/BIC/);
  }

  {
    const html = formatReplyHtml(
      `Je confirme votre inscription au briefing collectif du 23 septembre à 10h00.

Répondez non si vous ne souhaitez plus de messages.

Béatrice Meyer
 
Hercule, Courtage contrat BNC/BIC`,
    );
    assert.match(html, /briefing collectif du 23 septembre/);
    assert.match(html, /<p>Béatrice Meyer<br\/>Hercule, <i>Courtage contrat BNC\/BIC<\/i><\/p>/);
    assert.doesNotMatch(html, /Béatrice Meyer<br\/> <br\/>Hercule/);
  }

  {
    const html = formatReplyHtml(
      `Pour découvrir les flux qualifiés en cours et le format de collaboration :

hercule.dev

${BEATRICE_SIGNATURE}
hercule.dev Courtage contrat BNC/BIC
https://hercule.dev`,
    );
    assert.match(html, /Hercule, <i>Courtage contrat BNC\/BIC<\/i>/);
    assert.doesNotMatch(html, /hercule\.dev Courtage contrat BNC\/BIC/);
    assert.doesNotMatch(html, /<p>Béatrice Meyer<br\/>Hercule, Courtage[^<]*<br\/><a href="https:\/\/hercule\.dev">/);
  }

  {
    const html = formatReplyHtml("Merci pour votre retour.", {
      signatureMode: "jum",
    });
    assert.match(html, /Béatrice Meyer/);
    assert.match(html, /Secrétaire Comptable JUM — jum-advisory\.com/);
    assert.doesNotMatch(html, /Hercule, <i>Courtage contrat BNC\/BIC<\/i>/);
    assert.doesNotMatch(html, /hercule\.dev/);
  }

  console.log("format-reply-html.test.ts: OK");
}

main();
