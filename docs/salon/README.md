# Mode démonstration salon — Sécuri’Click

Faire découvrir l’application en moins d’une minute, sans compte, sans réseau,
sans jamais toucher aux données réelles.

## En bref : le jour du salon

1. **La veille** : installer la dernière version sur deux téléphones (un
   iPhone, un Android). Imprimer à 100 % `planche-10-qr-scenarios-A4.pdf`
   (2 pages) et les deux `chevalet-*-A4.pdf`.
2. **Avant l’ouverture** :
   - Téléphone 1 → **Essayer sans compte → Établissement → Scanner**, autoriser
     la caméra. C’est le « scanner du stand ».
   - Scanner les 10 QR de la planche : 5 VALIDÉS, 5 REFUSÉS. Si c’est bon, tout
     est prêt.
   - Scanner un chevalet avec l’appareil photo d’un téléphone : la page de
     téléchargement de securi-click.com doit s’ouvrir.
3. **Avec un visiteur** :
   - il scanne un chevalet (ou n’importe quel QR de la planche) avec **son**
     téléphone : la page de téléchargement s’ouvre, il choisit App Store ou
     Google Play ;
   - une fois l’application installée : **Essayer sans compte**, puis le rôle
     indiqué sur le chevalet ;
   - en rôle Parent, il ajoute une personne autorisée puis génère un QR code ;
     il le présente au scanner du stand, qui le valide comme en vrai. Un second
     scan du même QR est refusé (usage unique).
   - Les 10 QR de la planche servent à montrer vite les cas validés et refusés.
4. **Entre deux visiteurs** : bandeau « Démo » en haut → **Recommencer la
   démonstration**.

Rien n’est envoyé ni enregistré : toutes les personnes et tous les enfants sont
fictifs, et la démo fonctionne même sans réseau.

## 1. Ce que voit le visiteur

| Entrée                                    | Ce qui s’ouvre                                    |
| ----------------------------------------- | ------------------------------------------------- |
| QR chevalet, avec l’appareil photo        | securi-click.com, section « Télécharger »         |
| QR de la planche, avec l’appareil photo   | securi-click.com, section « Télécharger »         |
| QR de la planche, dans l’application      | Résultat de la vérification (validé ou refusé)    |
| Écran d’accueil → **Essayer sans compte** | Choix du rôle : Parent, Collecteur, Établissement |

Pendant toute la démo, un bandeau en haut affiche **« Démo · données fictives · rôle »**.
Il ouvre le menu : changer de rôle, revoir les instructions, recommencer, quitter.
Un guide de trois étapes s’affiche sous le bandeau ; il ne masque aucun bouton
et se ferme avec **Passer**.

## 2. Les dix QR codes de la planche

Chaque QR contient une adresse du site, par exemple
`https://securi-click.com/?demo=authorized-grandmother#telecharger` :

- **avec l’appareil photo d’un téléphone**, il ouvre la page de téléchargement :
  le visiteur choisit l’App Store ou Google Play ;
- **dans l’application** (rôle Établissement, onglet Scanner), il donne
  toujours le même résultat de démonstration.

| QR  | Situation                         | Résultat                                          |
| --- | --------------------------------- | ------------------------------------------------- |
| 01  | Emma · Sophie Martin, grand-mère  | VALIDÉ — collecteur autorisé                      |
| 02  | Lucas · Thomas Martin, père       | VALIDÉ — autorisation liée à cet enfant           |
| 03  | Emma · Julie Bernard, nounou      | VALIDÉ — autorisation temporaire active (7 jours) |
| 04  | Lucas · Alex Durand               | REFUSÉ — personne non autorisée                   |
| 05  | Emma · code expiré                | REFUSÉ — QR code expiré                           |
| 06  | Inès · Paul Moreau, parent        | VALIDÉ — récupération par le parent               |
| 07  | Léa · Marie Petit, parent         | VALIDÉ — récupération par le parent               |
| 08  | Lucas · Sophie Martin, grand-mère | REFUSÉ — autorisation révoquée                    |
| 09  | Noé · Thomas Martin               | REFUSÉ — pas autorisé pour cet enfant             |
| 10  | Emma · Julie Bernard, nounou      | REFUSÉ — QR code déjà utilisé                     |

Le parcours est cohérent entre les rôles : si le parent révoque Sophie pour
Emma, le QR 01 devient **REFUSÉ** ; s’il lui rend l’accès à Lucas, le QR 08
devient **VALIDÉ**. Les anciens QR imprimés (`SECURICLICK-DEMO:v1:…`) restent
reconnus.

Sans caméra (permission refusée, simulateur), le bouton **Simuler un scan**
propose les dix mêmes codes à l’écran.

## 3. Les QR générés en direct

Un visiteur en rôle Parent ou Collecteur génère son QR sur son téléphone et le
présente au scanner du stand (rôle Établissement), exactement comme dans la
vraie application. Le QR contient l’enfant, la personne autorisée et sa date
d’expiration : le stand le valide même s’il ne connaît pas cette personne (par
exemple Nina Roux, ajoutée pendant la démo). Il est **à usage unique** et
expire au bout de 24 h.

Aucun QR de démo n’atteint le serveur : scanné dans l’application réelle, il
est refusé avant tout appel réseau.

## 4. Préparer le stand

1. Installer une build contenant ce mode (voir § 8) sur deux appareils.
2. Appareil 1 : **Essayer sans compte → Établissement**, onglet Scanner,
   autoriser la caméra.
3. Appareil 2 : **Essayer sans compte → Parent**.
4. Imprimer `docs/salon/qr/planche-10-qr-scenarios-A4.pdf` (2 pages) et les
   deux `chevalet-*-A4.pdf`, à 100 % (sans « ajuster à la page »).
5. Tester chaque QR imprimé, sous l’éclairage du stand, avant l’ouverture.

Entre deux visiteurs : menu du bandeau → **Recommencer la démonstration**. Les
données reviennent à leur état initial et l’écran de choix du rôle s’affiche.
Rien n’est à configurer, aucun compte à communiquer.

## 5. Ce que la démo garantit

- **Aucun accès aux données réelles.** Les écrans réels sont réutilisés, mais
  chaque service (`parentService`, `schoolService`, `collectorService`,
  `qrService`, `historyService`, `pickupAuthorizationService`, notifications)
  passe par une frontière unique, `demoAware`, qui bascule vers une
  implémentation locale tant qu’une démo est ouverte.
- **Aucune requête ne sort.** En plus de cette frontière, le client Supabase
  refuse toute requête pendant la démo (`src/lib/network/requestPolicy.ts`), à
  la seule exception du rafraîchissement du jeton d’une vraie session déjà
  ouverte en dessous. Aucun e-mail, SMS, invitation ou compte n’est créé.
- **Aucun écho en production.** Un QR de démo scanné en mode réel est refusé
  avant tout appel serveur, et le serveur ne le connaît de toute façon pas
  (`validate_qr_and_create_pickup` n’accepte que des jetons de `qr_codes`).
  Rien n’a été modifié côté base, RLS ou fonctions.
- **Session réelle intacte.** La démo superpose une identité fictive sans
  jeton ; la session Supabase stockée n’est ni lue ni modifiée. « Quitter la
  démo » rend l’accès au compte réel, avec son cache.
- **Rien n’est conservé.** L’état de démo vit en mémoire uniquement ; il n’est
  jamais écrit sur le disque, ni dans le cache hors-ligne. Le code PIN saisi
  dans le formulaire n’est pas gardé.
- **Fonctionne hors-ligne.** Aucune donnée de démo ne dépend du réseau.

## 6. Démarrage hors-ligne de l’application (tous les utilisateurs)

- Au lancement, la session est restaurée depuis l’appareil si le réseau ne
  répond pas en 4 secondes ou n’est pas joignable ; la session n’est fermée que
  si le serveur rejette explicitement le jeton.
- Les dernières données consultées sont conservées **chiffrées** (AES-GCM, clé
  dans le trousseau via SecureStore) pendant 7 jours, pour un seul compte. Elles
  sont effacées, clé comprise, à la déconnexion. Les pièces d’identité ne sont
  jamais écrites sur le disque.
- Hors-ligne, un écran affiche ses données en cache ; l’écran d’erreur
  n’apparaît que s’il n’a rien à montrer. Les écritures ne sont jamais mises en
  file d’attente : elles échouent tout de suite avec un message.
- Toute requête bloquée sur un réseau saturé est abandonnée après 15 secondes
  (sauf les envois de fichiers).

## 7. Liens des QR et téléchargement

Tous les QR imprimés pointent vers la section « Télécharger » du site existant,
`https://securi-click.com/#telecharger`, qui propose l’App Store et Google
Play. **Rien n’est à déposer sur le site** : la section existe déjà, et le
paramètre `?demo=…` des QR de la planche est simplement ignoré par le site.

Les liens des stores ne fonctionnent que si la version publiée contient le mode
démo (§ 8) et, sur Android, que si l’application est sur une piste publique.

Le dossier `docs/salon/site/` (ouverture directe de l’application par lien
universel) reste disponible pour plus tard ; il n’est pas utilisé par ces QR.

## 8. Livraison : une nouvelle build est obligatoire

Le passage à Expo SDK 58 (React Native 0.88), l’ajout d’`expo-crypto` et du
domaine associé modifient le binaire natif. **Une mise à jour OTA ne suffit
pas** : l’empreinte `runtimeVersion` change, il faut `eas build` puis une
soumission aux stores. Les builds 1.1.0 existantes ne recevront pas ces
changements.

## 9. Activer, désactiver, régénérer

- Le mode démo est isolé dans `src/features/demo/`. Pour le retirer de
  l’interface, supprimer le bouton dans `RoleChoiceScreen` et les routes
  `app/demo/` ; la frontière `demoAware` reste inerte tant qu’aucune démo n’est
  ouverte.
- Régénérer les QR : `bun run demo:qr` (SVG, PNG 2000 px, PDF A4 dans
  `docs/salon/qr/`).
- Modifier la famille fictive : `src/features/demo/domain/seed.ts`. Identités
  inventées, aucune photo, adresses e-mail en `.invalid`.

## 10. Limites connues

- Pas de réinitialisation automatique après inactivité : utiliser
  **Recommencer la démonstration** entre deux visiteurs.
- Pas de démo web : sans l’application, le visiteur arrive sur la page de
  téléchargement du site.
- Photos, pièce d’identité et archivage fonctionnent en démo : les images
  restent sur l’appareil, en mémoire, et disparaissent au redémarrage de la
  démo. Seule l’acceptation d’une invitation par e-mail n’existe pas (les
  collecteurs ajoutés sont actifs immédiatement).
- Chaque appareil garde son propre état fictif : un QR généré sur un téléphone
  est bien validé par la tablette, mais une révocation faite ensuite sur le
  téléphone n’est pas connue de la tablette (il n’y a pas de serveur).
- Vérifications restant à faire sur appareils réels : Android, iPhone physique,
  QR imprimés sous lumière forte.
