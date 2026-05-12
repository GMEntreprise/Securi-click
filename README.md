| Rôle             | Fonctionnalités clés                                            |
| ---------------- | --------------------------------------------------------------- |
| **Parent**       | Connexion, gestion enfants & autorisations, QR code, historique |
| **Personnel**    | Scan QR, validation/refus récupération, historique              |
| **School Admin** | Gestion école, classes, élèves, supervision sorties             |
| **Super Admin**  | Gestion globale, établissements, analytics                      |

---

## 🔄 Flow global

### 🧑‍👧 Côté Parent

1. Connexion sécurisée
2. Ajout enfant(s)
3. Gestion des personnes autorisées
4. Génération QR Code temporaire
5. Notification après récupération

### 🏫 Côté Personnel

1. Scan du QR Code parent
2. Vérification des permissions
3. Validation **ou** refus
4. Enregistrement automatique dans l’historique

---

## 🛣️ Roadmap Développement

### Phase 1 – Foundation

| Étape | Tâche                                                              |
| ----- | ------------------------------------------------------------------ |
| 1     | Initialisation projet (Expo, TS strict, ESLint, Prettier, aliases) |
| 2     | Design System (couleurs, spacing, typo, shadows, dark mode)        |
| 3     | UI Foundation (Button, Input, Modal, Card, Loader, Toast, Avatar)  |
| 4     | Navigation (routes auth, protégées, rôles, splash flow)            |
| 5     | Supabase Setup (auth, DB, storage, realtime, RLS)                  |

### Phase 2 – Authentification

| Étape | Tâche                                                          |
| ----- | -------------------------------------------------------------- |
| 6     | Auth (signup, login, logout, restore session, forgot password) |
| 7     | RBAC (rôles, permissions, guards, RLS)                         |

### Phase 3 – Database Core

| Étape | Tâche                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------ |
| 8     | Modélisation tables (users, schools, classrooms, children, guardians, authorizations, qr_codes, pickup_logs) |
| 9     | Feature Schools (CRUD, multi-tenant)                                                                         |
| 10    | Feature Classrooms                                                                                           |
| 11    | Feature Children (profil, photo, relations)                                                                  |

### Phase 4 – Security System

| Étape | Tâche                                                 |
| ----- | ----------------------------------------------------- |
| 12    | Feature Guardians (personnes autorisées)              |
| 13    | Pickup Authorizations (horaires, jours, expiration)   |
| 14    | QR Generation (dynamique, expiration, rotation token) |
| 15    | QR Scanner (scan, validation, refus)                  |
| 16    | Pickup Flow (logs, notifications)                     |

### Phase 5 – Realtime

| Étape | Tâche                      |
| ----- | -------------------------- |
| 17    | Push notifications         |
| 18    | Synchronisation temps réel |

### Phase 6 – Admin

| Étape | Tâche                                      |
| ----- | ------------------------------------------ |
| 19    | Dashboard (statistiques, incidents, suivi) |
| 20    | Audit Logs (sécurité, historique complet)  |

### Phase 7 – Hardening

| Étape | Tâche                                 |
| ----- | ------------------------------------- |
| 21    | Offline Mode (retry, cache, fallback) |
| 22    | Performance Optimization              |
| 23    | Testing (unit, intégration, e2e)      |
| 24    | Security Hardening (audit global)     |
| 25    | Deployment (EAS Build, Stores, CI/CD) |

---

## ✅ Bonnes pratiques obligatoires

### 🚫 Interdictions

- Logique métier dans l’UI
- Gros composants
- État dupliqué
- Styles inline
- Fonctions inline inutiles

### ✅ Obligatoire

- TypeScript strict
- Composants atomiques
- Services séparés
- Hooks réutilisables
- Validation Zod systématique
- États de chargement & erreurs gérés
- Error Boundaries

---

## ⚡ Stratégie Performance

- **FlashList** pour les longues listes
- **Reanimated** pour les animations
- Mémoïsation (`memo`, `useMemo`, `useCallback`)
- Optimistic updates
- Cache d’images
- Éviter les contextes volumineux
- Proscrire les re-renders inutiles

---

## 🔒 Sécurité QR Code

✅ Le QR code doit être :

- Temporaire (durée de vie courte)
- Signé (jeton serveur)
- Unique (à usage unique)
- Validé côté serveur

❌ **Jamais :**

- QR statique
- Validation uniquement frontend

---

## 🧭 Stratégie de développement

> **1 FEATURE = 1 CYCLE COMPLET**

Pour chaque feature :

1. Architecture
2. Types
3. Base de données (migrations, RLS)
4. Services (logique métier)
5. Hooks
6. Store (si nécessaire)
7. UI (composants, écrans)
8. États (loading, empty, error, edge cases)
9. Optimisation
10. Tests

➡️ Puis **seulement** : feature suivante.

---

## 🎯 Objectif final

Créer une application :

- **Premium**
- **Fluide**
- **Sécurisée**
- **Scalable**
- **Maintenable**
- Sans dette technique
- Sans re-renders inutiles
- Avec une **UX moderne et rassurante**

---

## 📄 Licence

_À définir_
