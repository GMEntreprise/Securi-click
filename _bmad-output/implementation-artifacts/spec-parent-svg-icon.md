---
title: 'Create a recognizable parent SVG icon'
type: 'feature'
created: '2026-11-07'
status: 'done'
route: 'one-shot'
---

# Create a recognizable parent SVG icon

## Intent

**Problem:** The Parent role needs a clear, reusable vector symbol depicting the relationship between an adult and a child.

**Approach:** Draw an adult holding a smaller child's hand, using solid rounded shapes and blue/orange colors. Provide a standalone SVG and a theme-aware React Native SVG component. Use the component for Parent on the role-choice and demo screens, preserving the other role images. Verified on the iPhone 16 Plus simulator; TypeScript passes and scoped lint reports only an existing hook dependency warning. Dark-theme colors are implemented but not visually tested.

## Suggested Review Order

1. [SVG artwork](../../assets/images/roles/parent.svg): reusable vector export.
2. [ParentIcon](../../src/shared/ui/icons/ParentIcon.tsx): theme-aware native rendering.
3. [Role choice](../../src/features/auth/screens/RoleChoiceScreen.tsx) and [demo picker](../../src/features/demo/components/DemoRolePicker.tsx): Parent-only integration.
