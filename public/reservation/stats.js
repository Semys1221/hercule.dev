/**
 * Browser stats UI — keep formulas aligned with lib/booking/outreach-stats-model/compute.ts
 */
(function (global) {
  function positiveResponseRate(emailsRef, positivesRef) {
    if (emailsRef <= 0) return 0;
    return positivesRef / emailsRef;
  }

  function rdvFromEmails(emails, positiveRate, bookingRate) {
    return emails * positiveRate * bookingRate;
  }

  function emailsForTargetRdv(targetRdv, positiveRate, bookingRate) {
    var d = positiveRate * bookingRate;
    if (d <= 0) return Infinity;
    return targetRdv / d;
  }

  function daysToSendVolume(emailsNeeded, emailsPerDay) {
    if (emailsPerDay <= 0) return Infinity;
    return emailsNeeded / emailsPerDay;
  }

  function formatPercent(rate, digits) {
    digits = digits === undefined ? 3 : digits;
    return (rate * 100).toFixed(digits).replace(".", ",") + " %";
  }

  function formatNum(value, digits) {
    digits = digits === undefined ? 1 : digits;
    return value.toLocaleString("fr-FR", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    });
  }

  function getNicheFromQuery() {
    var params = new URLSearchParams(window.location.search);
    return params.get("niche") || "restaurant";
  }

  function renderFunnel(root, emailsRef, positivesRef, bookingRate) {
    var rate = positiveResponseRate(emailsRef, positivesRef);
    var rdv = rdvFromEmails(emailsRef, rate, bookingRate);
    root.innerHTML =
      '<div class="funnel-step"><strong>' +
      emailsRef.toLocaleString("fr-FR") +
      '</strong>emails</div>' +
      '<div class="funnel-arrow">→<br>' +
      formatPercent(rate) +
      "</div>" +
      '<div class="funnel-step"><strong>' +
      positivesRef +
      '</strong>rép. positives</div>' +
      '<div class="funnel-arrow">→<br>' +
      formatPercent(bookingRate, 0) +
      "</div>" +
      '<div class="funnel-step"><strong>' +
      formatNum(rdv, 1) +
      "</strong>RDV estimés</div>";
  }

  function renderProjectionTable(tbody, rows, bookingRate) {
    var html = rows
      .map(function (row) {
        var rate = positiveResponseRate(row.emails, row.positives);
        var rdv = rdvFromEmails(row.emails, rate, bookingRate);
        return (
          "<tr><td class=\"num\">" +
          row.emails.toLocaleString("fr-FR") +
          '</td><td class="num">' +
          row.positives +
          '</td><td class="num">' +
          formatNum(rdv, 1) +
          "</td></tr>"
        );
      })
      .join("");
    tbody.innerHTML = html;
  }

  function renderTimeline(el, config, bookingRate) {
    var rate = positiveResponseRate(config.emailsRef, config.positivesRef);
    var needed = emailsForTargetRdv(config.targetRdv, rate, bookingRate);
    var days = daysToSendVolume(needed, config.emailsPerDay);
    var rdvPerDay = rdvFromEmails(config.emailsPerDay, rate, bookingRate);

    el.innerHTML =
      "<p class=\"highlight\">~" +
      formatNum(days, 1) +
      " jours</p>" +
      "<p>Pour atteindre <strong>" +
      config.targetRdv +
      " RDV</strong> à <strong>" +
      formatPercent(bookingRate, 0) +
      "</strong> de booking (hypothèse " +
      config.positivesRef +
      " réponses / " +
      config.emailsRef.toLocaleString("fr-FR") +
      " emails), il faut envoyer environ <strong class=\"num\">" +
      Math.round(needed).toLocaleString("fr-FR") +
      " emails</strong> à <strong>" +
      config.emailsPerDay.toLocaleString("fr-FR") +
      " emails/jour</strong>.</p>" +
      "<p>Régime établi : ~<strong>" +
      formatNum(rdvPerDay, 2) +
      " RDV/jour</strong> à ce rythme d’envoi.</p>";
  }

  function renderScenarios(container, scenarios, targetRdv) {
    container.innerHTML = scenarios
      .map(function (s) {
        var rate = positiveResponseRate(s.emailsRef, s.positivesPerEmailsRef);
        var rdvAtRef = rdvFromEmails(s.emailsRef, rate, s.bookingRate);
        var needed = emailsForTargetRdv(targetRdv, rate, s.bookingRate);
        return (
          '<div class="card scenario-card"><h3>' +
          s.title +
          "</h3><p>Sur " +
          s.emailsRef.toLocaleString("fr-FR") +
          " emails : ~" +
          formatNum(rdvAtRef, 1) +
          " RDV. Pour " +
          targetRdv +
          " RDV : ~" +
          Math.round(needed).toLocaleString("fr-FR") +
          " emails.</p></div>"
        );
      })
      .join("");
  }

  function bindInputs(config, niche) {
    var emailsRef = document.getElementById("input-emails-ref");
    var positivesRef = document.getElementById("input-positives-ref");
    var bookingRate = document.getElementById("input-booking-rate");
    var emailsPerDay = document.getElementById("input-emails-per-day");
    var targetRdv = document.getElementById("input-target-rdv");

    emailsRef.value = String(config.emailsRef);
    positivesRef.value = String(config.positivesRef);
    bookingRate.value = String(config.bookingRateDefault * 100);
    emailsPerDay.value = String(config.emailsPerDayDefault);
    targetRdv.value = String(config.targetRdv);

    function readConfig() {
      return {
        emailsRef: Number(emailsRef.value) || config.emailsRef,
        positivesRef: Number(positivesRef.value) || config.positivesRef,
        emailsPerDay: Number(emailsPerDay.value) || config.emailsPerDayDefault,
        targetRdv: Number(targetRdv.value) || config.targetRdv,
        bookingRate: (Number(bookingRate.value) || 20) / 100,
        projectionRows: niche.projectionRows,
        scenarios: niche.scenarios,
      };
    }

    function refresh() {
      var c = readConfig();
      renderFunnel(
        document.getElementById("funnel"),
        c.emailsRef,
        c.positivesRef,
        c.bookingRate,
      );
      renderProjectionTable(
        document.getElementById("projection-body"),
        c.projectionRows,
        c.bookingRate,
      );
      renderTimeline(document.getElementById("timeline"), c, c.bookingRate);
    }

    [emailsRef, positivesRef, bookingRate, emailsPerDay, targetRdv].forEach(
      function (el) {
        el.addEventListener("input", refresh);
      },
    );
    refresh();
  }

  function init() {
    var nicheKey = getNicheFromQuery();
    fetch("/reservation/stats-niches.json")
      .then(function (r) {
        if (!r.ok) throw new Error("Config introuvable");
        return r.json();
      })
      .then(function (all) {
        var niche = all[nicheKey];
        if (!niche) throw new Error("Niche inconnue : " + nicheKey);

        document.title = niche.label + " — projections";
        document.getElementById("page-title").textContent = niche.label;
        document.getElementById("page-meta").textContent =
          "Modèle emails → réponses positives → RDV (niche=" + nicheKey + ")";

        var insights = document.getElementById("insights");
        insights.innerHTML = niche.insights
          .map(function (t) {
            return "<li>" + t + "</li>";
          })
          .join("");

        var live = document.getElementById("live-link");
        if (niche.liveMetricsUrl) {
          live.href = niche.liveMetricsUrl;
          live.hidden = false;
        }

        renderScenarios(
          document.getElementById("scenarios"),
          niche.scenarios,
          niche.targetRdv,
        );
        bindInputs(niche, niche);
      })
      .catch(function (e) {
        document.getElementById("error").textContent = e.message;
        document.getElementById("error").hidden = false;
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.OutreachStats = {
    positiveResponseRate: positiveResponseRate,
    rdvFromEmails: rdvFromEmails,
  };
})(window);
