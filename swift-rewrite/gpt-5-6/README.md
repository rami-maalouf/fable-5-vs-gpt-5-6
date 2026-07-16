# Twilight

An Expo SDK 57 port of the Twilight sleep tracker for iOS, Android, and web.

## Requirements

- Bun 1.3 or newer
- Xcode with an iOS simulator for local iOS builds
- Android Studio with an emulator for local Android builds

## Setup

```bash
bun install
```

Twilight uses native Expo modules, so run it in a development build rather than Expo Go:

```bash
bun run ios
bun run android
```

After the first native build, start Metro with:

```bash
bun run start
```

## Quality checks

```bash
bun run test
bun run typecheck
bun run lint
```

The app uses Expo Router with native Home, Metrics, Logs, and Settings tabs. Product requirements and implementation order live in `test-3-spec.md`, `plan.md`, and `todo.md`.
