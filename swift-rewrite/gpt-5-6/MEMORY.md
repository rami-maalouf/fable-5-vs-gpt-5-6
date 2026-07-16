# Project Environment

- Project: Twilight Expo port
- Stack: Expo SDK 57.0.6, React Native 0.86.0, React 19.2.3, TypeScript 6.0.3 strict
- Package manager: Bun 1.3.14
- Metro port: 8081
- Start Metro: `bun run start`
- iOS development build: `bunx expo run:ios`
- Android development build: `bunx expo run:android`
- Tests: `bun run test`
- Typecheck: `bunx tsc --noEmit`
- Lint: `bun run lint`
- Native directories: generated on first platform build
- Argent MCP: configured for simulator and React Native debugging
- Original Swift app identifier: `studio.orbitlabs.twilight`
- Port identifier: `studio.orbitlabs.twilight.expo` so both apps can coexist
- URL scheme: `twilight`
