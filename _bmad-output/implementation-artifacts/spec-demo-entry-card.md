---
title: 'Place the demo entry above Parent'
type: 'feature'
created: '2026-11-07'
status: 'done'
route: 'one-shot'
---

# Place the demo entry above Parent

## Intent

**Problem:** The demo entry is a cramped secondary button in the fixed footer.

**Approach:** Move it above Parent and use the demo card styling: orange play icon, translated title and description, and trailing chevron. Preserve direct navigation to `/demo`. Measure the fixed footer height to provide accurate scroll clearance. Verified visually on iPhone 16 Plus. Demo tests pass. Broader checks encountered unrelated legal-screen translation failures while those files were being edited concurrently; lint has no errors.

## Suggested Review Order

1. [RoleChoiceScreen](../../src/features/auth/screens/RoleChoiceScreen.tsx): demo card placement, accessibility and footer clearance.
