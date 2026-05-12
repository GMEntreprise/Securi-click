---

## description: Additional constraints for EPCT workflow in English (with shared/ui structure)

# EPCT Workflow - Additional Constraints

This document extends the [EPCT-WORKFLOW.md](EPCT-WORKFLOW.md) with additional constraints to ensure code quality, maintainability, and scalability.

## 1. File Line Limits (Convention)

**Goal:** Ensure readability and maintainability.

### Guidelines

* **Simple UI components**: ideally **≤ 150 lines**
* **Full screens**: target **200–400 lines** max
* **Custom hooks / utils**: aim for **≤ 200 lines**
* **Refactor signal**:

  * `> 400 lines` → consider extracting
  * **`> 500 lines` → mandatory refactor**

> 📝 **Note:** These are guidelines, not hard rules. If a file exceeds the limits, document the reason directly in the code (short comment) and in the PR description.

### ESLint Configuration

```json
{
  "rules": {
    "max-lines": [
      "warn",
      {
        "max": 400,
        "skipBlankLines": true,
        "skipComments": true
      }
    ]
  }
}
```

---

## 2. Reusable UI Components

Whenever a UI element is **likely to be reused** (even potentially), **extract it into a reusable component** and place it under `shared/ui/`.

### Rules for Reusable Components

1. **Clear, descriptive names** (e.g., `PrimaryButton`, `ConfirmModal`, `UserAvatar`)
2. **Documentation**: Document `props`, `variants`, and expected behavior (README or minimal JSDoc)
3. **Visual examples**: Add to lookbook / storybook (if available)
4. **Tests**: Provide basic tests (snapshot + behavior)
5. **Composition over duplication**: Favor composition via props instead of duplicating code
6. **Centralized exports**: Export components via a central `index.ts` for simpler imports

### Component Structure

```
shared/
└── ui/
    ├── index.ts                    # Central export file
    ├── Button/
    │   ├── PrimaryButton.tsx
    │   ├── SecondaryButton.tsx
    │   └── index.ts
    ├── Modal/
    │   ├── ConfirmModal.tsx
    │   ├── InfoModal.tsx
    │   └── index.ts
    └── Avatar/
        ├── UserAvatar.tsx
        └── index.ts
```

### Example: Reusable Component

```tsx
// shared/ui/Button/PrimaryButton.tsx

import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Primary action button used across the app
 * @param title - Button text
 * @param onPress - Callback when pressed
 * @param disabled - Disable interaction
 * @param loading - Show loading state
 */
export const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
}: PrimaryButtonProps) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}>
      <Text style={styles.text}>{loading ? 'Loading...' : title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### Centralized Export

```ts
// shared/ui/index.ts

export { PrimaryButton } from './Button/PrimaryButton';
export { SecondaryButton } from './Button/SecondaryButton';
export { ConfirmModal } from './Modal/ConfirmModal';
export { UserAvatar } from './Avatar/UserAvatar';
```

---

## 3. State Management Best Practices

To ensure scalability and predictable state behavior:

- Avoid excessive use of **`useState`** for global or shared state.
- Use **Zustand** or other lightweight global state libraries for better structure and performance.
- Prefer derived state and memoized selectors instead of deeply nested React state.

### Recommended Patterns

✅ Use **Zustand** for application-wide state
✅ Keep **`useState`** local for small UI states only (e.g., modal open/close)
✅ Avoid prop drilling; use stores or context for shared data

### Example

```ts
// shared/state/useUserStore.ts

import { create } from 'zustand';

interface UserState {
  user: { id: string; name: string } | null;
  setUser: (user: UserState['user']) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
```

---

## 4. Enforcement & Best Practices

### PR Checklist

Before submitting a PR, ensure:

- [ ] Does any file exceed the defined line limit? If yes, is it documented?
- [ ] Was reusable UI extracted into `shared/ui/`?
- [ ] Are there tests for new components?
- [ ] Is there minimal documentation (JSDoc or README)?
- [ ] Does the component follow the existing naming conventions?
- [ ] Are all imports using the centralized export (`shared/ui/index.ts`)?
- [ ] Cross-platform compatibility verified (iOS + Android)?
- [ ] State managed properly (prefer Zustand over scattered useState)?

### Technical Recommendations

1. **ESLint**: Configure `max-lines` rule to warn on files exceeding recommended line count
2. **PR Automation**: Add GitHub Actions or similar to warn on large files
3. **Code Review**: Reviewers should verify component reusability and proper extraction
4. **Testing**: Ensure all shared UI components have at least snapshot tests
5. **Documentation**: Keep `shared/ui/README.md` updated with component catalog
6. **State Management**: Encourage use of centralized store libraries (e.g., Zustand)

---

## 5. Anti-Patterns to Avoid

❌ **Don't:**

- Copy-paste UI components between screens
- Create components with 500+ lines without refactoring
- Skip documentation for shared components
- Hardcode styles that should be reusable
- Create one-off components that could be generalized
- Use too many `useState` hooks for shared/global state

✅ **Do:**

- Extract reusable components to `shared/ui/`
- Keep components focused and single-purpose
- Document props and usage
- Use composition and variants
- Use Zustand or similar for scalable state management
- Refactor when files exceed limits

---

## Summary

These constraints ensure:

- ✅ **Maintainable codebase** through line limits
- ✅ **Reusable components** properly organized in `shared/ui/`
- ✅ **Predictable state management** with Zustand
- ✅ **Proper documentation** and testing
- ✅ **Scalable architecture** for future development
- ✅ **Cross-platform consistency** (iOS + Android)

All constraints work together with the EPCT workflow (Explore, Plan, Code, Test) and the database schema documented in [ConnectStar-DB.md](ConnectStar-DB.md).
