/** Unit tests for format-reply-html link and signature rules. */

import assert from "node:assert/strict";

import {
  BEATRICE_SIGNATURE,
  ensureBeatriceSignature,
  formatReplyHtml,
  plainTextToHtml,
} from "@/lib/ai-reply-agent/format-reply-html";

function main() {
  {
    const result = ensureBeatriceSignature("Merci pour votre message.");
    assert.match(result, /Béatrice Meyer/);
    assert.match(result, /hercule\.dev/);
    assert.ok(result.indexOf("Béatrice Meyer") < result.indexOf("hercule.dev"));
  }

  {
    const body = `Bonjour.\n\n${BEATRICE_SIGNATURE}`;
    const result = ensureBeatriceSignature(body);
    assert.match(result, /https:\/\/hercule\.dev/);
  }

  {
    const url = "https://www.hercule.dev/reservation.html/abc123";
    const html = formatReplyHtml(
      `Réservez ici : ${url}\n\n${BEATRICE_SIGNATURE}\nhttps://hercule.dev`,
    );
    assert.match(html, new RegExp(`<a href="${url}">Réserver</a>`));
    assert.doesNotMatch(html, new RegExp(`Réservez ici : ${url}`));
  }

  {
    const html = formatReplyHtml(
      `Détails sur https://hercule.dev/cvg\n\n${BEATRICE_SIGNATURE}\nhttps://hercule.dev`,
    );
    assert.match(html, /<a href="https:\/\/hercule\.dev\/cvg">hercule\.dev<\/a>/);
  }

  {
    const html = formatReplyHtml("Merci pour votre retour.");
    assert.match(html, /Béatrice Meyer/);
    assert.match(html, /<a href="https:\/\/hercule\.dev">hercule\.dev<\/a>/);
  }

  {
    const html = formatReplyHtml("<script>alert(1)</script>");
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /&lt;script&gt;/);
  }

  {
    const cta = "https://www.hercule.dev/reservation.html/slug";
    const html = formatReplyHtml("Merci.", { ctaLink: cta });
    assert.match(html, new RegExp(`<a href="${cta}">Réserver</a>`));
  }

  {
    const html = plainTextToHtml("Line one\n\nLine two");
    assert.match(html, /<p>Line one<\/p>/);
    assert.match(html, /<p>Line two<\/p>/);
  }

  console.log("format-reply-html.test.ts: OK");
}

main();
