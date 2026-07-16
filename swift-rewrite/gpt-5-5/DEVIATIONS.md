# deviations

## task 1

- used Expo Router `Tabs` instead of `NativeTabs` for the initial scaffold. `NativeTabs`
  built and installed, but rendered a blank white screen on the simulator with no React
  Native accessibility tree. The stable `Tabs` navigator keeps the four-tab shell
  bootable while still rendering the required iOS SF Symbols through `expo-symbols`.
- kept routes under `src/app` because the existing SDK 57 starter is configured that
  way and Expo CLI confirmed `src/app` as the Expo Router root.

## task 2

- the shared external `todo.md` already had tasks 2-4 checked, but this app did not
  contain the task 2 domain files or tests. Treated the app worktree as authoritative
  and implemented task 2 before moving to later tasks.
