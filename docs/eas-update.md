# EAS Update — SecuriClick

Publier une correction JavaScript sans repasser par l'App Store et Google Play.

## 1. Ce qu'est une update OTA

Une update EAS remplace le **bundle JavaScript et les assets** d'une application
déjà installée. Elle ne touche pas au binaire natif. L'appareil télécharge la
nouvelle version en arrière-plan et l'applique **au lancement suivant**.

Elle ne remplace pas une build : tout ce qui est natif continue de passer par
`eas build` puis les stores.

## 2. Quand une update suffit, quand une build est obligatoire

Le garde-fou est automatique. `runtimeVersion` utilise la stratégie
`fingerprint` : Expo calcule une empreinte de tout ce qui compose le binaire
natif — dépendances natives, plugins de configuration, permissions, version du
SDK. Si cette empreinte change, l'update **ne peut pas atteindre** les builds
existantes.

Vérifié sur ce projet :

| Modification               | Empreinte Android | Conséquence                |
| -------------------------- | ----------------- | -------------------------- |
| Fichier `.ts` modifié      | inchangée         | update livrable            |
| Permission Android ajoutée | change            | nouvelle build obligatoire |

**Livrable en OTA** : logique métier, composants, styles, textes et
traductions, corrections de bugs JS, requêtes Supabase, navigation Expo Router.

**Exige une nouvelle build** : nouvelle dépendance native, ajout ou changement
d'un plugin de configuration, permission iOS ou Android, montée de version du
SDK Expo, modification de `app.config.ts` touchant au natif.

En cas de doute, la commande tranche :

```bash
bunx expo-updates fingerprint:generate --platform android
bunx expo-updates fingerprint:generate --platform ios
```

Empreinte identique à celle de la build en production : l'update passera.
Différente : elle n'atteindra personne, il faut rebuilder.

## 3. Changer la version de l'application

`version` dans `app.config.ts` fait partie de l'empreinte. La faire passer de
`1.0.0` à `1.1.0` change donc le `runtimeVersion` : les builds de la version
précédente ne recevront plus aucune update, ce qui est le comportement voulu —
une nouvelle version publique implique une nouvelle build.

Conséquence pratique : **monter la version impose de produire une nouvelle
build avant de pouvoir publier la moindre update.**

`buildNumber` et `versionCode` sont gérés par EAS (`appVersionSource: "remote"`
et `autoIncrement` en production) et sont **exclus** du calcul d'empreinte. La
valeur écrite dans `app.config.ts` n'est pas celle utilisée par EAS ;
`autoIncrement` ne change donc jamais le `runtimeVersion`.

## 3. Canaux

Un canal par public. Un profil de build est lié à un canal dans `eas.json`,
et une update publiée sur un canal n'atteint que les builds de ce canal.

| Profil de build           | Canal         | Public                   |
| ------------------------- | ------------- | ------------------------ |
| `development`             | `development` | build de développement   |
| `preview` / `preview-aab` | `preview`     | tests internes           |
| `production`              | `production`  | App Store et Google Play |

Une update `preview` ne peut pas atteindre les appareils du public. C'est le
filet de sécurité principal.

## 4. Publier en preview

```bash
git checkout main && git pull
bun install
bun run typecheck && bun run lint && bun run test
bunx eas update --channel preview --message "fix: description précise"
```

Le message est repris dans l'historique EAS. Écrire ce qui change, pas `update`
ni `fix`.

## 5. Publier en production

Uniquement après avoir installé l'update preview sur un appareil réel et testé
au minimum : connexion, restauration de session, rôle affiché, navigation, la
fonctionnalité modifiée, et le scan QR si le QR est concerné.

```bash
bunx eas update --channel production --message "fix: description précise"
```

Pour une modification sensible, livrer progressivement :

```bash
bunx eas update --channel production --rollout-percentage 10 --message "..."
```

## 6. Vérifier ce qui est déployé

```bash
bunx eas channel:list
bunx eas branch:list
bunx eas update:list --branch production
```

Chaque update expose son identifiant, sa `runtimeVersion`, sa plateforme et son
message. Publier depuis un arbre git propre pour que le commit reste
identifiable :

```bash
git status --short   # doit être vide
git log --oneline -1
```

## 7. Revenir en arrière

```bash
bunx eas update:rollback
```

La commande est interactive et propose deux options :

- **republier une update précédente** — les appareils reviennent à cette
  version, l'historique est conservé ;
- **revenir à l'update embarquée** — les appareils reprennent le bundle livré
  avec le binaire, en ignorant toutes les updates publiées.

Publier à nouveau après un rollback annule celui-ci : tous les appareils
reçoivent la nouvelle update.

## 8. Diagnostiquer

L'application ne bloque jamais au démarrage. `fallbackToCacheTimeout` vaut `0` :
elle démarre immédiatement sur la version déjà présente et télécharge la
nouvelle en arrière-plan. `useEmbeddedUpdate` reste actif, donc une première
ouverture hors ligne fonctionne avec le bundle du binaire.

| Symptôme                                                | Piste                                                                |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| L'update n'arrive pas                                   | canal de la build ≠ canal de publication (`eas channel:list`)        |
| L'update n'arrive toujours pas                          | empreinte différente : comparer `fingerprint:generate` avec la build |
| Elle arrive au deuxième lancement                       | comportement normal, l'application applique au lancement suivant     |
| L'application démarre sur l'ancienne version hors ligne | comportement normal                                                  |

## 9. Ne jamais publier

- une update qui suppose une migration de base non encore appliquée ;
- une migration destructive tant qu'une version antérieure de l'application est
  encore installée — procéder par étapes : élargir le schéma, livrer le code
  compatible, migrer les données, puis restreindre ;
- une update sans avoir passé typecheck, lint et tests.

Aucun secret ne transite par une update : seules les variables préfixées
`EXPO_PUBLIC_` sont embarquées dans le bundle.
