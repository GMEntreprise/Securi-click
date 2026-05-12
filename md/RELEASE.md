# Release Guide - ConnectStar

## Processus de Release

### 1. Mettre a jour la version

Modifier la version dans **2 fichiers** (ils doivent etre synchronises) :

**app.config.ts** (ligne ~41) :
```ts
version: '1.2.3',  // <- nouvelle version
```

**package.json** (ligne ~4) :
```json
"version": "1.2.3"
```

### 2. Commit les changements

```bash
git add -A
git commit -m "release: v1.2.3"
```

### 3. Creer le tag et pusher

```bash
git tag v1.2.3
git push origin main
git push origin v1.2.3
```

### 4. Resultat automatique

Le workflow GitHub Actions `release.yml` va automatiquement :
- Generer un changelog a partir des commits depuis la derniere release
- Creer une **GitHub Release** sur https://github.com/GMEntreprise/ConnectStarV1/releases
- Le badge dans le README se met a jour automatiquement

---

## Convention de Versioning

Format : `MAJOR.MINOR.PATCH`

| Type | Quand | Exemple |
|------|-------|---------|
| **PATCH** (x.x.X) | Bug fix, correction crash | `1.2.2` -> `1.2.3` |
| **MINOR** (x.X.0) | Nouvelle feature | `1.2.3` -> `1.3.0` |
| **MAJOR** (X.0.0) | Breaking change, refonte | `1.3.0` -> `2.0.0` |

---

## Tracer un bug en production

1. Ouvrir **Firebase Crashlytics**
2. Regarder la **version** du crash (ex: `1.2.2`)
3. Aller sur GitHub Releases : https://github.com/GMEntreprise/ConnectStarV1/releases
4. Trouver la release `v1.2.2` pour voir les commits inclus
5. Comparer avec la release suivante pour voir si le fix est deploye

---

## Commande rapide (copier-coller)

Remplacer `X.Y.Z` par la nouvelle version :

```bash
# Tout en une commande
VERSION="1.2.3" && \
  sed -i '' "s/version: '.*'/version: '$VERSION'/" app.config.ts && \
  sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json && \
  git add app.config.ts package.json && \
  git commit -m "release: v$VERSION" && \
  git tag "v$VERSION" && \
  git push origin main && \
  git push origin "v$VERSION"
```

---

## Historique des releases

| Version | Date | Notes |
|---------|------|-------|
| v1.2.2 | 2026-02-17 | Fix crashes Android JavascriptException, OpenStreetMap maps, Firebase ShareExtension |
