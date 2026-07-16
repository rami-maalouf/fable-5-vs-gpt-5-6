# Deviations And Judgment Calls

## 2026-07-16

- Set the iOS bundle identifier to `com.rami.nova.gpt56` because the spec requires a native simulator build but did not provide an identifier.
- Added Zod 4 as a direct dependency because `@openai/agents` declares it as a peer dependency and the API route benefits from a single validated request boundary.
- Added Bun's built-in test runner and type declarations rather than introducing Jest. The starter had no test infrastructure, and Bun already provides the required isolated contract tests.
- Kept API response errors intentionally generic. Invalid payloads return `Invalid request.` and a missing key returns `Server is not configured.` so validation details and secrets never cross the server boundary.
