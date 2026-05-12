# SecuriClick

Application mobile React Native/Expo sécurisée avec stack moderne.

## Stack Technique

- **Core**: React Native, Expo SDK 55, TypeScript
- **Navigation**: Expo Router
- **Backend**: Supabase
- **State Management**: Zustand + React Query
- **Styling**: NativeWind + TailwindCSS
- **Forms**: React Hook Form + Zod
- **Animations**: React Native Reanimated
- **Storage**: Secure Store + Async Storage

## Démarrage

1. Installer les dépendances
   ```bash
   bun install
   ```

2. Configurer l'environnement
   ```bash
   cp .env.example .env
   # Ajouter vos clés Supabase dans .env
   ```

3. Lancer le projet
   ```bash
   bun start
   ```

## Structure du Projet

```
src/
├── app/          # Écrans et navigation
├── components/   # Composants réutilisables
├── features/     # Fonctionnalités
├── services/     # Services externes
├── hooks/        # Hooks personnalisés
├── store/        # État global
├── lib/          # Bibliothèques utilitaires
├── utils/        # Fonctions utilitaires
├── constants/    # Constantes
├── theme/        # Thème et styles
├── types/        # Types TypeScript
└── providers/    # Providers React
```

## Scripts Disponibles

- `bun start` - Démarrer le serveur de développement
- `bun android` - Lancer sur Android
- `bun ios` - Lancer sur iOS
- `bun web` - Lancer sur Web
- `bun lint` - Linter le code
