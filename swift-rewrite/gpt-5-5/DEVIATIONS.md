# deviations

## task 1

- used Expo Router `Tabs` instead of `NativeTabs` for the initial scaffold. `NativeTabs`
  built and installed, but rendered a blank white screen on the simulator with no React
  Native accessibility tree. The stable `Tabs` navigator keeps the four-tab shell
  bootable while still rendering the required iOS SF Symbols through `expo-symbols`.
- kept routes under `src/app` because the existing SDK 57 starter is configured that
  way and Expo CLI confirmed `src/app` as the Expo Router root.
