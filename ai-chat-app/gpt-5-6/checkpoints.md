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

## Native Chat Screen - Task 5

Status: passed on 2026-07-16.

- Multiline input: six explicit lines expanded the composer to its cap, then scrolled internally while the action button stayed fixed.
- Send behavior: the explicit send action cleared the input, preserved line breaks in the user message, kept the keyboard visible, and swapped to `Stop generation` while streaming.
- Keyboard attachment: two interactive keyboard-dismiss cycles kept the composer attached to the keyboard and screen bottom without a gap or layout jump.
- Rotation: portrait, landscape left, landscape right, and repeated portrait transitions kept the focused composer and keyboard clear of the header and message content.
- Haptics: Expo Haptics was linked in the native build, and the accepted-send path executed without a runtime error.
- Native build: 0 errors and 0 warnings after marking Expo Dev Launcher's generated strip phase as intentionally always-run.
- Automated gates: 9 Bun tests passed; `bunx tsc --noEmit` passed; `bun run lint` passed.

Evidence:

- `verification/05-multiline-keyboard-light.png`
- `verification/05-keyboard-attached-light.png`
- `verification/05-landscape-keyboard-light.png`
