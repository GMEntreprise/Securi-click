---
description: Explore codebase, create implementation plan, code, and test following EPCT workflow
---

# Explore, Plan, Code, Test Workflow

At the end of this message, I will ask you to do something.
Please follow the "Explore, Plan, Code, Test" workflow when you start.

## Explore

First, use parallel subagents to find and read all files that may be useful for implementing the ticket, either as examples or as edit targets. The subagents should return relevant file paths, and any other info that may be useful.

## Plan

Next, think hard and write up a detailed implementation plan. Don't forget to include tests, lookbook components, and documentation. Use your judgement as to what is necessary, given the standards of this repo.

If there are things you are not sure about, use parallel subagents to do some web research. They should only return useful information, no noise.

If there are things you still do not understand or questions you have for the user, pause here to ask them before continuing.

## Code

When you have a thorough implementation plan, you are ready to start writing code. Follow the style of the existing codebase (e.g. we prefer clearly named variables and methods to extensive comments). Make sure to run our autoformatting script when you're done, and fix linter warnings that seem reasonable to you.

### Important

- You code ALWAYS stay on the SCOPE of the changes. Do not changes anything else. Keep stuck to your task and goal.
- Do not comments your code.

### Performance Optimization Guidelines

**React Performance Best Practices:**

1. **Prevent Unnecessary Re-renders**
   - Use `React.memo()` for components that receive the same props
   - Implement `useMemo()` for expensive calculations
   - Use `useCallback()` for function references passed as props
   - Avoid creating objects/arrays directly in JSX props

2. **Hook Optimization**
   - Memoize dependencies in useEffect with `useMemo()` or `useCallback()`
   - Use `useLayoutEffect` only when DOM measurements are needed
   - Avoid inline functions in dependency arrays
   - Extract stable references outside components when possible

3. **Modern React Hooks (React lastest)**
   - **React Query**: Use for server state management, caching, and synchronization

   \`\`\`tsx
   // ✅ Good: Using new hooks for better UX
   import { use, useOptimistic, useActionState } from 'react';
   import { useQuery } from '@tanstack/react-query';

   // Server state with React Query
   const { data, isLoading } = useQuery({
   queryKey: ['users'],
   queryFn: fetchUsers,
   staleTime: 5 _ 60 _ 1000, // 5 minutes
   });

   // Optimistic updates
   const [optimisticMessages, addOptimisticMessage] = useOptimistic(
   messages,
   (state, newMessage) => [...state, { ...newMessage, pending: true }]
   );

   // Server actions with state
   const [state, formAction, isPending] = useActionState(
   async (prevState, formData) => {
   // Server action logic
   return { success: true };
   },
   { success: false }
   );

   // Non-blocking transitions
   const [isPending, startTransition] = useTransition();
   const handleSearch = (query: string) => {
   startTransition(() => {
   setSearchResults(expensiveSearch(query));
   });
   };
   \`\`\`

4. **Component Architecture**
   - **ALWAYS use Reacticx UI library from `src/components/ui/`** (https://www.reacticx.com/docs)
   - **Install Reacticx components**: `npx reacticx add <component>` (e.g., `npx reacticx add button`)
   - **Available categories**: atoms, base, molecules, organisms, templates, micro-interactions
   - **Browse components**: `npx reacticx list` or visit https://www.reacticx.com/docs
   - Never duplicate component logic - create reusable hooks instead
   - Split large components into smaller, focused ones
   - Use compound components pattern for complex UI
   - For bottom sheets: use `import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';`
   - Respect architecture of the app

   **Reacticx Examples:**
   ```tsx
   // ✅ Use Reacticx components from src/components/ui/
   import { Button } from '@/src/components/ui/button';
   import { Toast } from '@/src/components/ui/toast';
   import { BottomSheet } from '@/src/components/ui/bottom-sheet';

   // ✅ Components are headless, animated (60fps), and customizable
   <Button onPress={handlePress} variant="primary">
     Submit
   </Button>
   ```

5. **State Management**
   - Lift state up only when necessary - keep state local when possible
   - Use `useReducer` for complex state logic instead of multiple `useState`
   - Implement proper state normalization for lists/collections
   - Avoid derived state - use `useMemo()` instead
   - **Use React Query for server state, local state for UI state**
   - use for responsive design react-native-responsive-screen (responsive.ts) for all screen tablet, mobile IOS and Android

6. **Data Fetching Best Practices**
   \`\`\`tsx
   // ✅ Good: React Query for server state
   const useUserProfile = (userId: string) => {
   return useQuery({
   queryKey: ['user', userId],
   queryFn: () => fetchUser(userId),
   enabled: !!userId,
   staleTime: 10 _ 60 _ 1000, // 10 minutes
   });
   };

   // ✅ Good: Mutations with optimistic updates
   const useUpdateUser = () => {
   const queryClient = useQueryClient();
   return useMutation({
   mutationFn: updateUser,
   onMutate: async (newUser) => {
   await queryClient.cancelQueries(['user', newUser.id]);
   const previousUser = queryClient.getQueryData(['user', newUser.id]);
   queryClient.setQueryData(['user', newUser.id], newUser);
   return { previousUser };
   },
   onError: (err, newUser, context) => {
   queryClient.setQueryData(['user', newUser.id], context?.previousUser);
   },
   });
   };
   \`\`\`

7. **Anti-Patterns to Avoid**
   - ❌ Creating functions inside render: `onClick={() => handleClick()}`
   - ❌ Objects as useEffect dependencies: `useEffect(() => {}, [{ id }])`
   - ❌ Duplicating hooks across components
   - ❌ Recreating UI components when `components/ui/` exists (use Reacticx instead: `npx reacticx add <component>`)
   - ❌ Building custom buttons, modals, toasts when Reacticx provides them
   - ❌ Multiple useState for related data
   - ❌ Inline styles that recreate objects
   - ❌ Using useState for server data instead of React Query
   - ❌ Not using useOptimistic for better perceived performance
   - ❌ ERROR Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.

8. **Performance Patterns**
   \`\`\`tsx
   // ✅ Good: Memoized callback
   const handleClick = useCallback((id: string) => {
   onItemClick(id);
   }, [onItemClick]);

   // ✅ Good: Memoized computation
   const filteredItems = useMemo(() =>
   items.filter(item => item.active), [items]
   );

   // ✅ Good: Stable reference
   const config = useMemo(() => ({
   timeout: 5000,
   retries: 3
   }), []);

   // ✅ Good: Form status without prop drilling
   function SubmitButton() {
   const { pending } = useFormStatus();
   return (
   <Button type="submit" disabled={pending}>
   {pending ? 'Submitting...' : 'Submit'}
   </Button>
   );
   }
   \`\`\`

# Cross-Platform Development Rules (iOS & Android)

---

- Always develop with cross-platform compatibility in mind (iOS + Android).
- Never use platform-specific code unless strictly necessary; prefer shared components and APIs.
- When a platform-specific implementation is required, isolate it using `Platform.select` or `Platform.OS` checks, and document clearly.
- Ensure all UI layouts are tested on both iOS and Android (safe area, navigation bar, status bar, notch, keyboard behavior).
- Verify gestures, haptics, and animations behave consistently across devices.
- Use Expo and React Native APIs that guarantee compatibility across platforms first.
- Fonts, colors, and spacing must render the same visually on both iOS and Android.
- When testing, always run the app on both iOS Simulator and Android Emulator (minimum one device each).
- Do not hardcode platform-specific design (e.g., shadows on iOS, elevation on Android) without providing a consistent fallback.
- All new UI components must be validated on both platforms before merge.

## Test

Use parallel subagents to run tests, and make sure they all pass.

If your changes touch the UX in a major way, use the browser to make sure that everything works correctly. Make a list of what to test for, and use a subagent for this step.

If your testing shows problems, go back to the planning stage and think ultrahard.

<!-- ## Write up your work

When you are happy with your work, write up a short report that could be used as the PR description. Include what you set out to do, the choices you made with their brief justification, and any commands you ran in the process that may be useful for future developers to know about. -->
