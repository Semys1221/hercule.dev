"""Default Instantly bypass email copy for new campaign bootstrap."""

DEFAULT_E1_BODY_HTML = """<p>Voici plus de précisions.<br/><br/>Les demandes concernent principalement des indépendants et dirigeants de TPE qui n'arrivent plus à suivre seuls leur comptabilité, leurs échéances fiscales, leurs déclarations et leurs obligations administratives, et qui cherchent un cabinet pour reprendre ces sujets en main.<br/><br/>Ces demandes sont transmises à nos cabinets partenaires.<br/><br/>Pour recevoir ce type de contrat, votre cabinet doit compter plus de 3 associés ou collaborateurs.<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}</p>"""

DEFAULT_E2_BODY_HTML = """<p>Bonjour,<br/><br/>Je reviens vers vous concernant les demandes de contrat annuel en attente que nous recevons actuellement.<br/><br/>Si vous souhaitez postuler pour recevoir ces demandes mensuellement pour votre cabinet :<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}</p>"""

DEFAULT_E3_BODY_HTML = """<p>Bonjour {{first_name}},<br/><br/>N'ayant pas reçu de retour de votre part, je me dois de clôturer nos échanges ici.<br/><br/>Si le sujet devient pertinent pour votre cabinet à l'avenir, vous pourrez simplement revenir vers moi.<br/><br/>Bonne continuation,<br/><br/>{{accountSignature}}</p>"""

COMPTABLE_TEMPLATE_BODIES: dict[str, str] = {
    "interested_email1": DEFAULT_E1_BODY_HTML,
    "interested_email2": DEFAULT_E2_BODY_HTML,
    "interested_email3": DEFAULT_E3_BODY_HTML,
}
