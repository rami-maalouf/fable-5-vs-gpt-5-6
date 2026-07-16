# Verification Checkpoints

## Walking Skeleton

Status: passed on 2026-07-16.

- End-to-end device: iPhone 17 Pro Max simulator, iOS 26.5, Nova development build, Metro port 8090.
- Send and stream: a user prompt reached the local `/chat` API route and rendered the Luna response incrementally.
- Stop: a long response exposed `Stop generation`; aborting returned the composer to send state and preserved the received assistant text.
- Runtime: no warning or error entries were captured. The only console entry was React Native's standard app startup log.
- Automated gates: 9 Bun tests passed; `bunx tsc --noEmit` passed; `bun run lint` passed.
- Native build: 0 errors and 0 warnings.

Evidence:

- `verification/03-generating-light.png`
- `verification/03-basic-stream-light.png`
- `verification/03-stop-partial-light.png`

Code-quality review:

- Correctness: fixed native relative URL resolution, fail-fast behavior when no origin exists, concurrent-send guarding, and tokenless abort cleanup.
- Security: model values remain allowlisted and validated server-side; the OpenAI key stays server-only and was not logged.
- Readability and architecture: streaming transport remains isolated from React state; no additional state framework or general-purpose abstraction was introduced.
- Performance: chunk updates only replace the active assistant message. List anchoring and render polish remain scoped to tasks 4 and 5.

## Native Chat Screen - Task 4

Status: passed on 2026-07-16.

- Empty state: a fresh reload shows the compact Nova mark and `How can I help?` prompt.
- Message hierarchy: user prompts use a trailing neutral bubble; assistant responses remain full-width selectable text.
- Stream anchoring: a long response stayed pinned to its newest token without visible jumps.
- User control: dragging to earlier content during the stream held the same viewport while more tokens arrived.
- Automated gates: 9 Bun tests passed; `bunx tsc --noEmit` passed; `bun run lint` passed.

Evidence:

- `verification/04-empty-light.png`
- `verification/04-stream-anchored-light.png`
- `verification/04-manual-scroll-light.png`
