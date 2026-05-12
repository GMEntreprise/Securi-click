# SecuriClick - Guidelines de Développement

## 📋 Processus Obligatoire Avant Toute Feature

**AVANT de commencer ANY développement, je dois systématiquement me référer aux documents md/ suivants :**

### 🔴 Étape 1: Lecture des Guidelines (Obligatoire)

1. **EPCT-WORKFLOW.md** - Workflow Explore, Plan, Code, Test
2. **EPCT-CONSTRAINTS.md** - Contraintes de lignes et composants réutilisables
3. **MOBILE-DEVELOPER.md** - Standards React Native et performance
4. **mobile-design.md** - Design mobile-first et patterns UI
5. **supabase-best-pratice.md** - Optimisations Postgres et Supabase

### 🔴 Étape 2: Application du Workflow EPCT

#### **Explore**

- Utiliser des subagents parallèles pour trouver tous les fichiers pertinents
- Retourner les chemins de fichiers et informations utiles

#### **Plan**

- Plan d'implémentation détaillé avec tests, composants, documentation
- Recherche web si incertitudes
- Poser des questions si nécessaire

#### **Code**

- Respecter le style du codebase existant
- **TOUJOURS rester dans le SCOPE** - pas de changements externes
- **PAS de commentaires dans le code**
- Appliquer auto-formatting et corriger warnings ESLint

#### **Test**

- Tests complets selon standards du repo

---

## 🎯 Contraintes Clés à Respecter

### Performance Mobile (MOBILE-DEVELOPER.md)

- **Cold start**: < 1.5 secondes
- **Mémoire**: < 120MB baseline
- **Battery**: < 4% par heure
- **FPS**: 120 ProMotion / 60 minimum
- **Touch**: < 16ms response
- **App size**: < 40MB initial download
- **Crash rate**: < 0.1%

### Architecture React Native

- **Code sharing**: > 80% cross-platform
- **Offline-first**: Architecture de données
- **Push notifications**: FCM + APNS
- **Deep linking**: Universal Links
- **Native modules**: Biometrie, Camera, GPS, BLE

### Limites de Fichiers (EPCT-CONSTRAINTS.md)

- **Components UI simples**: ≤ 150 lignes
- **Écrans complets**: 200-400 lignes max
- **Hooks/utils**: ≤ 200 lignes
- **> 400 lignes**: Considérer refactor
- **> 500 lignes**: Refactor OBLIGATOIRE

### Composants Réutilisables

- **TOUJOURS** extraire si réutilisables (même potentiellement)
- Placer sous `shared/ui/`
- Noms descriptifs : `PrimaryButton`, `ConfirmModal`, `UserAvatar`

### Performance React (EPCT-WORKFLOW.md)

- **React.memo()** pour composants avec mêmes props
- **useMemo()** pour calculs coûteux
- **useCallback()** pour fonctions passées en props
- **Pas d'objets/arrays directement dans JSX props**
- **useLayoutEffect()** seulement pour mesures DOM

### Supabase & Postgres (supabase-best-pratice.md)

**Priorités par ordre d'importance :**

1. **Query Performance** (CRITICAL) - `query-`
2. **Connection Management** (CRITICAL) - `conn-`
3. **Security & RLS** (CRITICAL) - `security-`
4. **Schema Design** (HIGH) - `schema-`
5. **Concurrency & Locking** (MEDIUM-HIGH) - `lock-`
6. **Data Access Patterns** (MEDIUM) - `data-`
7. **Monitoring & Diagnostics** (LOW-MEDIUM) - `monitor-`
8. **Advanced Features** (LOW) - `advanced-`

---

## 🔧 Processus de Référence Systématique

### Pour chaque nouvelle feature :

1. **STOP** - Lire les documents md/ pertinents
2. **EXPLORE** - Analyser le codebase existant
3. **PLAN** - Documenter le plan d'implémentation
4. **CODE** - Implémenter dans le SCOPE uniquement
5. **TEST** - Tests complets
6. **REVIEW** - Vérifier contraintes performance/qualité

### Checklist avant de commencer :

- [ ] Lu EPCT-WORKFLOW.md ?
- [ ] Lu EPCT-CONSTRAINTS.md ?
- [ ] Lu MOBILE-DEVELOPER.md ?
- [ ] Lu mobile-design.md ?
- [ ] Lu supabase-best-pratice.md ?
- [ ] Plan d'implémentation documenté ?
- [ ] Impact performance évalué ?
- [ ] Composants réutilisables identifiés ?

---

## ⚠️ Règles d'Or

1. **NE JAMAIS** commencer sans lire les guidelines
2. **TOUJOURS** suivre le workflow EPCT
3. **JAMAIS** dépasser le SCOPE de la tâche
4. **JAMAIS** commenter le code
5. **TOUJOURS** optimiser pour mobile first
6. **TOUJOURS** extraire les composants réutilisables
7. **TOUJOURS** respecter les limites de performance

**VIOLATION de ces règles = Code non conforme**
