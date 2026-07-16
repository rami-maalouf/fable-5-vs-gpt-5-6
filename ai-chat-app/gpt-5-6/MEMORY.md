# Project Environment

- Expo SDK 57 managed React Native app with Expo Router and TypeScript strict mode.
- Supported platforms: iOS, Android, and web. Primary verification target: iPhone 17 Pro simulator.
- Package manager: Bun 1.3.14. Use `bun` and `bunx` for all JavaScript tooling.
- Metro port: 8081.
- Start: `bun run start`.
- Native iOS build: `bunx expo run:ios`.
- Quality gates: `bun run lint` and `bunx tsc --noEmit`.
- iOS bundle identifier: `com.rami.nova.gpt56`.
- Server routes use Expo Router server output and read non-public environment variables from `.env`.
- Argent MCP is available in the primary agent session for simulator discovery, interaction, and evidence capture.
