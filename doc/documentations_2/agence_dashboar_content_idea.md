**Le dashboard content**





Le dashboard est une standalone page, pas de navigation tout sera sur une page informative. Cette page est dynamique avec un slug par prospect qui se trouve dans la table client.





Dans le tableau il y a plein de props qui seront provisionné au load time par supabase per prospect slug.



Their is no login, only slug and database columns with all the prospect infos





**Structure idéale de ta page de tracking**



**1. Header**



**Hercule**



**Suivi de votre livraison**



Puis un identifiant :



**Commande #@ORDER_ID**



C’est ton équivalent du numéro de suivi DHL.



⸻



**2. Statut principal — l’élément le plus important**



Un gros bloc en haut :



**Votre première livraison est en préparation**



Livraison estimée entre le **@DATE_MIN** et le **@DATE_MAX**



Avec éventuellement une progression :



**Commande confirmée → Mise en place → En préparation → Livraison → Livrée**



C’est probablement **l’élément le plus important de toute la page**.



⸻



**3. Timeline**



C’est là que je copierais vraiment la logique DHL.



**✓ Commande confirmée**

@DATE — @TIME



**✓ Mise en place terminée**

@DATE — @TIME



**● Première livraison en préparation**

En cours



**○ Première demande attribuée**

À venir



La timeline permet au client de comprendre **ce qui a déjà été fait et ce qui reste à venir**. DHL affiche justement les événements de tracking avec date, heure et localisation/statut.  



⸻



**4. Détails de la livraison**



Un bloc du type :



**Détails de votre livraison**



- Type : @TYPE_DEMANDE
- Zone : @ZONE
- Première livraison : @DATE_MIN – @DATE_MAX
- Fréquence : @FREQUENCY
- Créneau de réception : @SCHEDULE



Pas besoin d’afficher 15 informations. Seulement ce qui permet au client de vérifier que **la commande correspond bien à ce qu’il a acheté**.



⸻



**5. Prochaine étape**



Très important dans ton cas.



**Prochaine étape**



Votre première demande est actuellement en préparation.



Vous n’avez aucune action à effectuer. Vous recevrez un email dès qu’une demande correspondant à vos critères sera disponible.



Ça remplace en quelque sorte le « Out for delivery » de DHL.



⸻



**6. CTA**



DHL permet notamment d’aller vers une expérience de gestion de livraison depuis le tracking.  



Pour Hercule, je mettrais :



**[ Voir mes critères de livraison ]**



ou, si le client peut réellement modifier ses paramètres :



**[ Gérer ma livraison ]**



Mais **pas un CTA commercial**. Une fois qu’il a payé, la page doit devenir un **outil opérationnel**, pas continuer à vendre.



⸻



**7. Support**



En bas :



**Une question concernant votre livraison ?**



Notre équipe traite les demandes 7j/7.



Délai maximal de traitement : **24 h**

Réponse quotidienne à **9h00, heure de Paris**



**[contact@hercule.dev](mailto:contact@hercule.dev)**













SIGNALER un problème = mail 





Tout ce fait par mail : pour un rdv le client peut signaler un problème 



= trigger un email resend to me + un email to him. Settings = se rétracter, renouveller, contacter, upgrade