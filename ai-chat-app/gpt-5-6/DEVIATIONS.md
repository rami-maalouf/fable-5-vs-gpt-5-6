# Deviations And Judgment Calls

## 2026-07-16

- Set the iOS bundle identifier to `com.rami.nova.gpt56` because the spec requires a native simulator build but did not provide an identifier.
- Added Zod 4 as a direct dependency because `@openai/agents` declares it as a peer dependency and the API route benefits from a single validated request boundary.
- Added Bun's built-in test runner and type declarations rather than introducing Jest. The starter had no test infrastructure, and Bun already provides the required isolated contract tests.
- Kept API response errors intentionally generic. Invalid payloads return `Invalid request.` and a missing key returns `Server is not configured.` so validation details and secrets never cross the server boundary.
- Added `expo-dev-client` after end-to-end verification found that the starter's plain debug binary could not consume an isolated Metro deep link. This keeps Nova on port 8090 without interrupting the sibling Expo project already using port 8081.
- Kept the client contract as relative `/chat`, then resolved that path against the Expo development host before passing it to native `expo/fetch`. Native networking has no browser origin, while web continues to use the relative path directly. Production native builds can provide `EXPO_PUBLIC_API_URL`.
- Used explicit end-follow state instead of `maintainVisibleContentPosition` for the non-inverted chat list. The latter preserves the first visible item while content is inserted, while Nova needs to follow a growing final item until a real user drag opts out.
- Changed the starter orientation lock from `portrait` to `default` because the composer acceptance test explicitly requires repeated rotation while the keyboard is active.
- Simulated Task 6's offline request by stopping the local API server while the already-loaded native app remained active because Argent exposes no simulator network toggle. Retry was then verified after restarting the same server. A temporary reader fault exercised the separate midstream branch and was removed before testing and commit.
- Store SQLite timestamps as Unix milliseconds and use application-generated text IDs. This preserves JavaScript precision, gives deterministic ordering, and avoids coupling UI state to SQLite insert IDs.
