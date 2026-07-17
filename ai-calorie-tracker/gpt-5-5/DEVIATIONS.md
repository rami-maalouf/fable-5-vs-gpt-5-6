# deviations and audit notes

## task 1 baseline audit

- Expo SDK is `~57.0.6`, React Native is `0.86.0`, TypeScript strict mode is enabled through `expo/tsconfig.base`.
- The provided starter routed from `src/app`; the benchmark backend spec requires `app/scan+api.ts`, so the starter routes were moved to top-level `app/` before product work starts.
- `expo-widgets` was present, but its app config entry had no widget definitions. The config now declares exactly one `RemainingCaloriesWidget` with `systemSmall` support.
- The provided starter did not include `@openai/agents`, `expo-camera`, `expo-image-picker`, `expo-image-manipulator`, `react-native-svg`, or test tooling. These were added because they are named by the prompt or approved spec.
- `.env` exists locally and remains ignored by `.gitignore`. It must stay untracked.
- The app now has `ios.bundleIdentifier` set to `com.rami.nourish` because the SDK 57 widgets plugin requires an iOS bundle identifier when configuring widget support.
- The empty `src/app` directory had to be removed after moving routes because Expo Router still selected it as the app root while it existed.
- Task 1 verification passed with `bun install`, `bun run test -- --runInBand`, `bun run lint`, `bunx tsc --noEmit`, `bunx expo export --platform web --no-ssg`, and `npx expo run:ios --device 93EEF062-B4DC-4989-AF77-CF47EE2A9816`.
- The iOS launch used the booted iPhone 17 Pro simulator on iOS 27.0. The development warning banner cleared after a Metro reload, and the runtime log registry reported zero entries.
