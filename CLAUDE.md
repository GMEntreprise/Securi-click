# SecuriClick — Directives de travail

Application React Native / Expo Router / TypeScript strict / Supabase.
Documents de référence : `DEVELOPMENT-GUIDELINES.md` et `md/**`.

## Règle fondamentale

**Ne jamais casser une fonctionnalité existante pour en corriger une autre.**

Avant toute modification, répondre à :

- Qui utilise ce code ?
- Quelle donnée modifie-t-il ?
- Quelle query dépend de cette donnée ?
- Quel rôle peut l'utiliser ?
- Quelle policy RLS la protège ?
- Quel écran dépend de cette query ?
- Quel test protège ce comportement ?

## Auditer avant de modifier

Ne rien écrire avant d'avoir compris l'architecture, les flows, les sources de
vérité, les mutations, les appels Supabase, les stores, les queries, les
policies RLS, les migrations, les Edge Functions et les tests existants.

Ne jamais inventer une table, une route, une API ou une règle métier. En cas de
doute, vérifier dans la codebase — ne pas supposer.

## Cycle TDD obligatoire

Pour chaque bug, sans exception :

```
BUG → REPRODUCTION → TEST QUI ÉCHOUE → ROOT CAUSE → FIX MINIMAL → TEST VERT → RÉGRESSION
```

1. **Reproduction** — formuler en Given / When / Then.
2. **Test rouge** — il doit échouer pour la bonne raison. Jamais de test
   artificiel écrit pour obtenir du vert.
3. **Root cause** — état, mutation incomplète, cache React Query obsolète,
   queryKey, invalidation manquante, race condition, RLS, trigger, mapping,
   navigation, stale closure, persistance, sérialisation, session.
4. **Fix minimal** — corriger la cause, pas le symptôme. Pas de réécriture ni
   d'abstraction si une correction simple et robuste suffit.
5. **Test vert**.
6. **Régression** — test ciblé → tests feature → intégration → suite globale.

Une correction n'est terminée que si les tests ciblés **et** de régression passent.

## Interdictions absolues

- `any`, `@ts-ignore`, `@ts-nocheck`, casts dangereux
- Désactiver la RLS pour résoudre un bug
- Placer un secret serveur dans le client
- Masquer une erreur, ou afficher une erreur technique brute à l'utilisateur
- `useEffect` ajouté pour « forcer » un refresh
- `setTimeout` pour masquer un problème de synchronisation
- Hack de navigation, state dupliqué
- Désactiver un test qui échoue, ou modifier un test pour qu'il accepte un
  comportement incorrect
- Commentaires dans le code applicatif

Toujours préférer _source de vérité + DB + API + cache + UI corrects_ à
_refresh forcé + timeout + state temporaire + hack UI_.

## Sécurité

Le frontend n'est **jamais** la source de vérité pour la sécurité. Les
garanties viennent de Supabase Auth, des contraintes PostgreSQL, de la RLS et
des Edge Functions.

Pour chaque table, tester SELECT / INSERT / UPDATE / DELETE avec : propriétaire
(autorisé), autre utilisateur (refusé), autre rôle (refusé), non authentifié
(refusé). Tester explicitement les tentatives d'IDOR.

Ne jamais logger mot de passe, access token, refresh token ou donnée sensible.

## Priorisation

| Niveau | Définition                                                                               |
| ------ | ---------------------------------------------------------------------------------------- |
| **P0** | Faille de sécurité, perte ou corruption de données, login impossible, crash systématique |
| **P1** | Fonctionnalité métier cassée, mauvais rôle, données incorrectes, navigation bloquée      |
| **P2** | Bug UX important, persistance ou synchronisation incorrecte                              |
| **P3** | Problème visuel, performance mineure, edge case                                          |
| **P4** | Amélioration, nettoyage, dette technique                                                 |

## Definition of Done

Comportement correct · test de reproduction si bug · test vert · régression
verte · TypeScript OK · lint OK · aucune erreur console critique · états
loading / error / empty corrects · offline vérifié · permissions vérifiées ·
RLS vérifiée · persistance vérifiée · cache vérifié · navigation vérifiée ·
iOS et Android vérifiés · sécurité vérifiée.

## Points de vigilance récurrents

- **React Query** — après une mutation, choisir explicitement `invalidateQueries`
  _ou_ `setQueryData`, jamais les deux inutilement. Traquer données obsolètes,
  invalidations manquantes, doubles requêtes, flash d'ancienne donnée.
- **Zustand** — selectors précis, jamais `useStore()` pour un seul champ.
  Nettoyage complet au logout.
- **Double soumission** — tous les boutons critiques résistants au double tap ;
  le backend reste idempotent quand nécessaire.
- **Race conditions** — l'unicité est garantie par la DB, pas par l'UI.
- **i18n** — jamais de `undefined`, `translation.key` ou clé manquante affichés.
  FR et EN maintenus à parité.
- **Performance** — ne pas ajouter `useMemo` / `useCallback` mécaniquement ;
  chaque optimisation doit être justifiée.

## Commandes du projet

```bash
bun run typecheck              # tsc --noEmit — objectif 0 erreur
bun run lint
bun run test                   # jest --runInBand
bun run directory:audit:paris  # audit annuaire officiel, périmètre Paris
bun run directory:audit:france # audit annuaire officiel, couverture nationale
bun run directory:sync:paris   # import annuaire, périmètre Paris
bun run directory:sync:france  # import annuaire, couverture nationale
```

Les migrations SQL vivent dans `database/migrations/` (ordre numérique) et les
tests pgTAP dans `supabase/tests/`. Ces derniers se terminent par `ROLLBACK` :
ce ne sont **pas** des migrations, ne jamais les exécuter comme telles.

## Critère de production

Ne jamais déclarer « prêt pour la production » parce que `bun run test` est vert.
La décision intègre code, architecture, base de données, auth, RLS, sécurité,
UX, performance, persistance, régression, E2E et build de production. Si un
problème critique subsiste, l'annoncer explicitement comme **NOT READY**.
