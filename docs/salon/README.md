# Mode démonstration salon — Sécuri’Click

Faire découvrir l’application en moins d’une minute, sans compte, sans réseau,
sans jamais toucher aux données réelles.

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

## 3. Deux familles de QR, à ne pas confondre

- **Chevalets** (2) : scannés avec l’appareil photo du visiteur. Ils ouvrent la
  démo sur **son** téléphone.
- **QR enfants** (5) : scannés **dans** Sécuri’Click, rôle Établissement.
  L’appareil photo classique n’en fait rien.

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
`https://securi-click.com/demo/parent/collecteurs`. **Au moment de cette
livraison, ces adresses renvoient 404** : il faut déposer sur le serveur le
contenu de `docs/salon/site/` :

- `demo/index.html` + `demo/.htaccess` : page de transition (application non
  installée) avec liens App Store / Google Play et bouton d’ouverture ;
- `.well-known/apple-app-site-association` : ouvre directement l’application sur
  iPhone (Team ID `N9M36K8YNL`) ;
- `.well-known/assetlinks.json` : remplacer `EMPREINTE_SHA256_DU_CERTIFICAT_DE_SIGNATURE`
  par l’empreinte SHA-256 du certificat de signature Android
  (`bunx eas credentials -p android`, ou Play Console → Intégrité de
  l’application). Sans cette valeur, Android ouvre la page web au lieu de
  l’application.

Vérifier après dépôt :

```bash
curl -I https://securi-click.com/.well-known/apple-app-site-association   # 200, application/json
curl -I https://securi-click.com/demo/etablissement                       # 200
```

Pour imprimer des chevalets vers une autre adresse :
`DEMO_BASE_URL=https://exemple.fr/demo bun run demo:qr`.

Les liens de l’App Store et de Google Play ne fonctionnent qu’une fois
l’application publiée sur ces stores (la piste Android est actuellement
`internal`).

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
- En démo, certaines actions sans intérêt pédagogique répondent « non
  disponible en mode démonstration » : envoi de photos, archivage de
  l’historique, vérification d’identité du collecteur.
- La démo ne montre pas une transaction distante entre deux appareils : chaque
  appareil a son propre état fictif. Révoquer Sophie sur l’appareil Parent ne
  change pas le résultat sur l’appareil Établissement.
- Vérifications restant à faire sur appareils réels : Android, iPhone physique,
  QR imprimés sous lumière forte, liens HTTPS après dépôt des fichiers.
