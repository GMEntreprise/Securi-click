# Mode démonstration salon — Sécuri’Click

Faire découvrir l’application en moins d’une minute, sans compte, sans réseau,
sans jamais toucher aux données réelles.

## En bref : le jour du salon

1. **La veille** : installer la dernière version sur deux téléphones (un
   iPhone, un Android). Imprimer à 100 % `planche-5-qr-scenarios-A4.pdf` et les
   deux `chevalet-*-A4.pdf`.
2. **Avant l’ouverture** :
   - Téléphone 1 → **Essayer sans compte → Établissement → Scanner**, autoriser
     la caméra. C’est la « tablette du stand ».
   - Scanner les 5 QR de la planche : 3 VALIDÉS, 2 REFUSÉS. Si c’est bon, tout
     est prêt.
   - Scanner un chevalet avec l’appareil photo de chaque téléphone : la démo doit
     s’ouvrir sur le bon écran.
3. **Avec un visiteur** :
   - il scanne un chevalet avec **son** téléphone : l’application s’ouvre, ou
     le store s’affiche pour l’installer ;
   - il ajoute une personne autorisée (rôle Parent) puis génère un QR code ;
   - il le présente au téléphone du stand, qui le valide comme en vrai. Un
     second scan du même QR est refusé (usage unique).
   - Les 5 QR de la planche servent à montrer vite les cas validés et refusés.
4. **Entre deux visiteurs** : bandeau « Démo » en haut → **Recommencer la
   démonstration**.

Rien n’est envoyé ni enregistré : toutes les personnes et tous les enfants sont
fictifs, et la démo fonctionne même sans réseau.

## 1. Ce que voit le visiteur

| Entrée                                    | Ce qui s’ouvre                                         |
| ----------------------------------------- | ------------------------------------------------------ |
| Écran d’accueil → **Essayer sans compte** | Choix du rôle : Parent, Collecteur, Établissement      |
| QR chevalet **Établissement**             | Accueil Établissement, École des Tilleuls déjà remplie |
| QR chevalet **Parent**                    | Parent → onglet Collecteurs                            |
| `securiclick://demo/collecteur`           | Accueil Collecteur (Sophie Martin)                     |

Pendant toute la démo, un bandeau en haut affiche **« Démo · données fictives · rôle »**.
Il ouvre le menu : changer de rôle, revoir les instructions, recommencer, quitter.
Un guide de trois étapes s’affiche sous le bandeau ; il ne masque aucun bouton
et se ferme avec **Passer**.

## 2. Les cinq QR codes enfants

À scanner **depuis l’application**, rôle Établissement, onglet Scanner.
Ils restent valables indéfiniment et donnent toujours le même résultat.

| QR  | Situation                        | Résultat                                          |
| --- | -------------------------------- | ------------------------------------------------- |
| 01  | Emma · Sophie Martin, grand-mère | VALIDÉ — collecteur autorisé                      |
| 02  | Lucas · Thomas Martin, père      | VALIDÉ — autorisation liée à cet enfant           |
| 03  | Emma · Julie Bernard, nounou     | VALIDÉ — autorisation temporaire active (7 jours) |
| 04  | Lucas · Alex Durand              | REFUSÉ — personne non autorisée                   |
| 05  | Emma · code expiré               | REFUSÉ — QR code expiré                           |

Le parcours est cohérent entre les rôles : si le parent révoque Sophie (onglet
Collecteurs), le QR 01 devient **REFUSÉ — autorisation révoquée** côté
Établissement. Un QR généré dans la démo (Parent ou Collecteur) est à usage
unique, comme un vrai.

Sans caméra (permission refusée, simulateur), le bouton **Simuler un scan**
propose les cinq mêmes codes à l’écran.

## 3. Comment fonctionnent les QR codes

Il existe trois sortes de QR, à ne pas confondre :

1. **QR des chevalets** (2) : le visiteur les scanne avec l’appareil photo de
   **son** téléphone. Le QR contient un lien `https://securi-click.com/demo/…`.
   - Application installée : le lien ouvre directement Sécuri’Click, déjà dans
     la démo, sur le bon écran (Établissement ou Parent → Collecteurs).
   - Application absente : la page web de transition s’affiche, avec les liens
     App Store / Google Play.
   - Prérequis : fichiers de `docs/salon/site/` déposés sur le serveur (§ 7) et
     nouvelle build installée (§ 8). Sans cela, utiliser le bouton
     **Essayer sans compte** de l’écran d’accueil.
2. **QR enfants imprimés** (5) : scannés **dans** Sécuri’Click, rôle
   Établissement, onglet Scanner. L’appareil photo classique n’en fait rien.
3. **QR générés en direct** : un visiteur en rôle Parent ou Collecteur génère
   son QR sur son téléphone et le présente à la tablette du stand (rôle
   Établissement), exactement comme dans la vraie application. Le QR contient
   l’enfant, la personne autorisée et sa date d’expiration : la tablette le
   valide même si elle ne connaît pas cette personne (par exemple Nina Roux,
   ajoutée pendant la démo). Il est **à usage unique** : un second scan est
   refusé, comme en production. Il expire au bout de 24 h.

Aucun de ces QR n’atteint le serveur : un QR de démo scanné dans l’application
réelle est refusé avant tout appel réseau.

## 4. Préparer le stand

1. Installer une build contenant ce mode (voir § 8) sur deux appareils.
2. Appareil 1 : **Essayer sans compte → Établissement**, onglet Scanner,
   autoriser la caméra.
3. Appareil 2 : **Essayer sans compte → Parent**.
4. Imprimer `docs/salon/qr/planche-5-qr-scenarios-A4.pdf` et les deux
   `chevalet-*-A4.pdf`, à 100 % (sans « ajuster à la page »).
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

## 7. Liens HTTPS des chevalets

Les chevalets pointent vers `https://securi-click.com/demo/etablissement` et
`https://securi-click.com/demo/parent/collecteurs`. Ce que voit le visiteur
après le scan, avec l’appareil photo de son téléphone :

| Téléphone  | Application installée                 | Application absente                                                                 |
| ---------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| iPhone     | Sécuri’Click s’ouvre sur le bon écran | [App Store](https://apps.apple.com/fr/app/securiclick/id6774208284)                 |
| Android    | Sécuri’Click s’ouvre sur le bon écran | [Google Play](https://play.google.com/store/apps/details?id=com.shavod.securiclick) |
| Ordinateur | —                                     | Page avec les deux boutons de téléchargement                                        |

**Au moment de cette livraison, ces adresses renvoient 404** : il faut déposer
sur le serveur le contenu de `docs/salon/site/` :

- `demo/index.html` + `demo/.htaccess` : page de transition. Elle reconnaît le
  téléphone : sur Android, elle ouvre l’application si elle est installée,
  sinon Google Play ; sur iPhone, elle renvoie vers l’App Store (si
  l’application est installée, iOS l’a déjà ouverte avant d’afficher la page) ;
- `.well-known/apple-app-site-association` : ouvre directement l’application sur
  iPhone (Team ID `N9M36K8YNL`) ;
- `.well-known/assetlinks.json` : remplacer `EMPREINTE_SHA256_DU_CERTIFICAT_DE_SIGNATURE`
  par l’empreinte SHA-256 du certificat de signature Android
  (`bunx eas credentials -p android`, ou Play Console → Intégrité de
  l’application). Avec cette valeur, Android ouvre l’application sans même
  afficher la page ; sans elle, la page fait le relais (un instant de plus).

Vérifier après dépôt :

```bash
curl -I https://securi-click.com/.well-known/apple-app-site-association   # 200, application/json
curl -I https://securi-click.com/.well-known/assetlinks.json              # 200, application/json
curl -I https://securi-click.com/demo/etablissement                       # 200
```

Pour imprimer des chevalets vers une autre adresse :
`DEMO_BASE_URL=https://exemple.fr/demo bun run demo:qr`.

Les liens des stores ne fonctionnent que si la version publiée contient le mode
démo (§ 8) et, sur Android, que si l’application est sur une piste publique
(elle est actuellement en piste `internal`).

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
  transition (installation).
- Photos, pièce d’identité et archivage fonctionnent en démo : les images
  restent sur l’appareil, en mémoire, et disparaissent au redémarrage de la
  démo. Seule l’acceptation d’une invitation par e-mail n’existe pas (les
  collecteurs ajoutés sont actifs immédiatement).
- Chaque appareil garde son propre état fictif : un QR généré sur un téléphone
  est bien validé par la tablette, mais une révocation faite ensuite sur le
  téléphone n’est pas connue de la tablette (il n’y a pas de serveur).
- Vérifications restant à faire sur appareils réels : Android, iPhone physique,
  QR imprimés sous lumière forte, liens HTTPS après dépôt des fichiers.
