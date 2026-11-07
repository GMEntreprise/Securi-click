---
title: 'Restore demo role row alignment'
type: 'bugfix'
created: '2026-11-07'
status: 'done'
route: 'one-shot'
---

# Restore demo role row alignment

## Intent

**Problem:** NativeWind interop drops the dynamic Pressable styles on the demo role picker, stacking each icon, text block and chevron vertically and removing the card styling.

**Approach:** Disable CSS interop on the two inline-styled Pressable declarations so React Native evaluates their existing style callbacks, including pressed feedback. Verified before and after on the running iPhone 16 Plus simulator. TypeScript and all 59 demo tests pass; lint has no errors and 22 existing warnings elsewhere. Android was not visually tested.

## Suggested Review Order

1. [DemoRolePicker](../../src/features/demo/components/DemoRolePicker.tsx): inspect the local interop opt-outs on role cards and the back button.
