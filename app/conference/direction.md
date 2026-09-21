Oui. Avec tes réponses, la direction artistique est suffisamment verrouillée. Je retiens surtout une chose : **on ne construit pas un deck, on construit une histoire animée contrôlée au clavier**. Chaque pression Espace fait avancer l’histoire d’un cran.

Je vais donc structurer le prochain script visuel comme un **storyboard exploitable par le développeur**, et non comme une liste de “slides”.

### **Direction que je retiens**

- **Très cinématique** : changements visuels fréquents, environ toutes les 5–10 secondes quand le discours le justifie.
- **Très peu de texte** : l’image raconte, le texte précise.
- **Personnages ultra-minimalistes** : cercle + arc, jamais d’illustrations complexes.
- **Icônes géométriques** : téléphone, oreille, calendrier, mallette, cœur, etc.
- **Noir / blanc / gris / silver**, avec couleur uniquement lorsqu’elle apporte une information.
- **Cartes dynamiques**, mais seulement lorsqu’elles servent la narration.
- **Transitions narratives variables** : fade, déplacement, zoom, morphing, apparition, disparition, etc., selon ce que raconte Evan.
- **Rubik’s Cube = fil rouge visuel** de toute la présentation.
- **Rubik’s Cube = seul élément réellement détaillé / 3D.**
- **Logo Hercule ↔ Rubik’s Cube** : connexion visuelle récurrente, notamment lors de la révélation de R2.
- **Hercule R2 = vraie révélation produit**, pas simplement trois mots affichés.
- **Démonstration John = histoire visuelle**, jamais un faux dashboard avec des volumes artificiellement énormes.
- Les volumes doivent rester **crédibles dans l’histoire** : 200 → qualification → profils restants → intérêt → rendez-vous, plutôt que 10 000 leads.
- **“Le prospect vient vous chercher” = rupture visuelle forte**, avec inversion du mouvement.
- **Les offres = deux mini-histoires distinctes**, pas deux pricing cards.
- Pour DEC : restaurant → problème → intervention → valeur économique → offre Hercule.
- Pour Courtage : médecin → problème → intervention → valeur économique → offre Hercule.
- **FAQ = extrêmement sobre** : uniquement la question à l’écran, puis Evan répond oralement en regardant le chat.
- **Fin = deux temps** :
  1. `LES DÉCISIONS DE DEMAIN SE PRENNENT MAINTENANT.` + logo Hercule.
  2. Espace → retour aux **deux offres**, qui restent affichées pendant que le prospect lit et utilise le lien du chat.

### **Une précision importante**

Je vais également traiter les **pressions Espace comme des beats narratifs**, pas comme des changements de slide arbitraires.

Par exemple :

« Les profils arrivent avec un niveau de confiance élevé. »

**Espace**

→ apparition de 5–6 bonshommes

**Espace**

→ cœur qui pulse au-dessus du groupe

**Espace**

« Le problème : vous ne contrôlez ni le volume… »

**Espace**

→ le groupe disparaît, trois cartes apparaissent :

`VOLUME ?` · `MOMENT ?` · `PROFIL ?`

Cela permettra au développeur de construire chaque état comme une séquence Framer Motion plutôt que comme une succession d’écrans indépendants.

Et surtout, je vais éviter de transformer **chaque phrase en animation**. Certaines phrases doivent simplement être dites pendant que la scène reste à l’écran. Sinon, le visuel devient lui-même distrayant.

Le prochain livrable doit donc être le **script visuel complet, du début jusqu’au retour final sur les deux offres**, avec pour chaque beat :

**N° → phrase prononcée → état visuel → animation → transition → éléments à l’écran → intention narrative.**