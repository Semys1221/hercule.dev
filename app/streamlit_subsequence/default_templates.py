"""Default Instantly bypass email copy for new campaign bootstrap."""

DEFAULT_E1_BODY_HTML = """<p>Voici plus de précisions.<br/><br/>L'un des groupes de clients que nous avons actuellement est constitué d'agences e-commerce de 3 à 12 salariés, disposant d'un budget annuel dédié à l'externalisation comptable. L'expertise recherchée est une approche à 360 : le social / paie, la tenue fiscale, conseils.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct. Si vous souhaitez candidater, proposez votre cabinet en cliquant ici : <a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>Pour recevoir ce type de contrat, votre cabinet doit compter au minimum 2 associés ou collaborateurs.<br/><br/>{{accountSignature}}</p>"""

DEFAULT_E2_BODY_HTML = """<p>Bonjour,<br/><br/>Je reviens vers vous concernant les demandes de contrat annuel en attente que nous recevons actuellement.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct.<br/><br/>Si vous souhaitez postuler pour recevoir ces demandes mensuellement pour votre cabinet :<br/><br/>Êtes-vous disponible le {{slot_1}} ou le {{slot_2}} ?<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}</p>"""

DEFAULT_E3_BODY_HTML = """<p>Bonjour {{first_name}},<br/><br/>N'ayant pas reçu de retour de votre part, je me dois de clôturer nos échanges ici.<br/><br/>Si le sujet devient pertinent pour votre cabinet à l'avenir, vous pourrez simplement revenir vers moi.<br/><br/>Bonne continuation,<br/><br/>{{accountSignature}}</p>"""

COMPTABLE_TEMPLATE_BODIES: dict[str, str] = {
    "interested_email1": DEFAULT_E1_BODY_HTML,
    "interested_email2": DEFAULT_E2_BODY_HTML,
    "interested_email3": DEFAULT_E3_BODY_HTML,
}

CIF_TEMPLATE_BODIES: dict[str, str] = {
    "interested_email1": """<p>Voici plus de précisions.<br/><br/>L'un des groupes de clients que nous avons actuellement est constitué d'indépendants et dirigeants de PME/TPE en recherche d'un accompagnement d'optimisation fiscale et de trésorerie dans votre secteur.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct. Si vous souhaitez candidater, proposez votre cabinet en cliquant ici : <a href="{{reservation_cif_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}</p>""",
    "interested_email2": """<p>Bonjour,<br/><br/>Je reviens vers vous concernant les demandes de contrat annuel en attente que nous recevons actuellement.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct.<br/><br/>Si vous souhaitez postuler pour recevoir ces demandes mensuellement pour votre cabinet :<br/><br/>Êtes-vous disponible le {{slot_1}} ou le {{slot_2}} ?<br/><br/><a href="{{reservation_cif_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}</p>""",
    "interested_email3": DEFAULT_E3_BODY_HTML.replace("{{reservation_entreprise_link}}", "{{reservation_cif_link}}"),
}
