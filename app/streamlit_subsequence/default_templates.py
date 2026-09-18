"""Default Instantly bypass email copy for new campaign bootstrap."""

DEFAULT_E1_BODY_HTML = """<p>Voici plus de précisions.<br/><br/>L'un des groupes de clients que nous avons actuellement est constitué d'agences e-commerce de 3 à 12 salariés, disposant d'un budget annuel dédié à l'externalisation comptable. L'expertise recherchée est une approche à 360 : le social / paie, la tenue fiscale, conseils.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct. Si vous souhaitez candidater, proposez votre cabinet en cliquant ici : <a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>L'appel de présentation de Hercule sera réalisé ce mercredi 23 septembre à 10h (heure de Paris).<br/><br/>{{accountSignature}}</p>"""

OPT_OUT_DISCLAIMER_HTML = (
    "<br/><br/><i>Répondez non si vous ne souhaitez plus de messages.</i>"
)

DEFAULT_E2_BODY_HTML = f"""<p>Bonjour,<br/><br/>Je reviens vers vous concernant les demandes de contrat annuel en attente que nous recevons actuellement.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct.<br/><br/>Si vous souhaitez postuler pour recevoir ces demandes mensuellement pour votre cabinet :<br/><br/>Êtes-vous disponible le {{{{slot_1}}}} ou le {{{{slot_2}}}} ?<br/><br/><a href="{{{{reservation_entreprise_link}}}}">Proposer mon cabinet</a>{OPT_OUT_DISCLAIMER_HTML}<br/><br/>{{{{accountSignature}}}}</p>"""

DEFAULT_E3_BODY_HTML = f"""<p>Bonjour {{{{first_name}}}},<br/><br/>N'ayant pas reçu de retour de votre part, je me dois de clôturer nos échanges ici.<br/><br/>Si le sujet devient pertinent pour votre cabinet à l'avenir, vous pourrez simplement revenir vers moi.<br/><br/>Bonne continuation,{OPT_OUT_DISCLAIMER_HTML}<br/><br/>{{{{accountSignature}}}}</p>"""

COMPTABLE_TEMPLATE_BODIES: dict[str, str] = {
    "interested_email1": DEFAULT_E1_BODY_HTML,
    "interested_email2": DEFAULT_E2_BODY_HTML,
    "interested_email3": DEFAULT_E3_BODY_HTML,
}

AGENCE_WEB_2_PIPELINE_BASE_URL = "https://www.hercule.dev/email/agence/pipeline"

AGENCE_WEB_2_PIPELINE_IMAGES_HTML = "".join(
    f'<img src="{AGENCE_WEB_2_PIPELINE_BASE_URL}/pipeline-{index}.png" '
    f'alt="Aperçu pipeline {index}" '
    f'style="max-width:100%;display:block;margin:12px 0;" />'
    for index in range(1, 6)
)

AGENCE_WEB_2_TEMPLATE_BODIES: dict[str, str] = {
    "interested_email1": f"""<p>Bonjour,<br/><br/>Les rendez-vous actuellement planifiés sont visibles ci-dessous.<br/><br/>Il s'agit de PME, de cabinets comptables et de conseillers financiers.<br/><br/>Nous générons actuellement 5 rendez-vous par jour, et 29 rendez-vous sont déjà planifiés.<br/><br/>L'accès illimité au pipeline est proposé à 1 200 € forfaitaires pour le premier mois.<br/><br/>Nous n'acceptons qu'une seule agence.<br/><br/>Pour postuler, répondez mercredi ou jeudi afin que nous puissions vous présenter le Calendly et le fonctionnement du pipeline lors d'un appel en visioconférence.<br/><br/>{AGENCE_WEB_2_PIPELINE_IMAGES_HTML}<br/><br/>Cordialement,<br/>{{{{accountSignature}}}}</p>""",
    "interested_email2": f"""<p>Bonjour,<br/><br/>Je reviens vers vous sur l'accès au pipeline de rendez-vous visio (PME, cabinets comptables, conseillers financiers).<br/><br/>Nous générons environ 5 rendez-vous par jour — 29 sont déjà planifiés.<br/><br/>L'accès illimité reste à 1 200 € forfaitaires le premier mois. Une seule agence sera retenue.<br/><br/>Êtes-vous disponible mercredi ou jeudi pour un appel visio (présentation Calendly + fonctionnement du pipeline) ?<br/><br/>Répondez simplement avec le jour qui vous convient.{OPT_OUT_DISCLAIMER_HTML}<br/><br/>Cordialement,<br/>{{{{accountSignature}}}}</p>""",
    "interested_email3": f"""<p>Bonjour {{{{first_name}}}},<br/><br/>N'ayant pas reçu de retour de votre part, je clôture ici la candidature pour l'accès au pipeline.<br/><br/>Si le sujet redevient pertinent pour votre agence, vous pourrez simplement répondre à cet email.<br/><br/>Bonne continuation,{OPT_OUT_DISCLAIMER_HTML}<br/><br/>{{{{accountSignature}}}}</p>""",
}

CIF_TEMPLATE_BODIES: dict[str, str] = {
    "interested_email1": """<p>Pour faire simple,<br/><br/>Nous avons des demandes de cabinets de dentistes et vétérinaires (2+ salariés), confrontés à des enjeux de croissance, trésorerie et pression fiscale.<br/><br/>L'expertise recherchée porte sur le placement des avoirs professionnels et privés et la réduction de la pression fiscale.<br/><br/>Les échanges démarrent entre le 19 sept. et le 02 oct.<br/><br/>Si vous souhaitez que nous vous mettions en relation avec ces cabinets : <a href="{{reservation_cif_link}}">Mon cabinet est compatible</a><br/><br/>L'appel de présentation de Hercule sera réalisé ce mercredi 23 septembre à 10h (heure de Paris).<br/><br/>{{accountSignature}}</p>""",
    "interested_email2": f"""<p>Bonjour,<br/><br/>Je reviens vers vous sur les demandes en attente — cabinets dentistes/vétérinaires (2+ salariés), enjeux trésorerie et fiscalité.<br/><br/>Les échanges démarrent entre le 19 sept. et le 02 oct.<br/><br/>Disponible le {{{{slot_1}}}} ou le {{{{slot_2}}}} ?<br/><br/><a href="{{{{reservation_cif_link}}}}">Mon cabinet est compatible</a>{OPT_OUT_DISCLAIMER_HTML}<br/><br/>{{{{accountSignature}}}}</p>""",
    "interested_email3": DEFAULT_E3_BODY_HTML.replace("{{reservation_entreprise_link}}", "{{reservation_cif_link}}"),
}
