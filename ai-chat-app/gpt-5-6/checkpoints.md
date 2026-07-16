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

## Native Chat Screen - Task 6 And Phase Checkpoint

Status: passed on 2026-07-16.

- Loading: an assistant progress indicator appeared immediately after send and remained until the first text chunk arrived.
- Pre-token failure: stopping the local API server while the loaded native app stayed active produced an inline, readable connection error and left the composer empty.
- Retry: restarting the server and tapping `Retry` resent the retained request history, removed the error row, and rendered a successful response without duplicating the user message.
- Midstream failure: a deterministic stream-reader fault retained the delivered partial text and rendered the same error row directly beneath it. The temporary fault was removed before the final gates.
- State safety: sending a different prompt settles any prior failed row so no stale Retry action remains.
- Appearance: a live React Native Appearance switch updated the error state, chat chrome, composer, and keyboard to dark mode without reloading. The override was restored to system appearance afterward.
- Scenarios 1-3: basic streaming and stop, long-response scroll anchoring, and offline failure plus retry all pass on the iPhone 17 Pro Max simulator.
- Automated gates: 14 Bun tests passed; `bunx tsc --noEmit` passed; `bun run lint` passed.

Evidence:

- `verification/06-loading-light.png`
- `verification/06-offline-error-light.png`
- `verification/06-midstream-error-light.png`
- `verification/06-error-dark.png`

Code-quality review:

- Correctness: pending, streaming, complete, and error transitions are explicit; retry retains the failed request history and replaces the failed assistant attempt in place.
- Recovery: abort before the first chunk removes the empty placeholder, while abort after a chunk preserves partial text without presenting an error.
- Security: user-visible errors remain generic and do not expose server response details or credentials.
- Accessibility: loading has a progress role, the error row announces as an alert, and Retry has a 44-point target with an explicit accessible label.
- Maintainability: pure chat-state helpers isolate transitions from transport and React, with focused tests for partial failure, retry reset, stale failure settlement, and request serialization.

## Persistence - Task 7

Status: passed on 2026-07-16.

- Migration: an isolated native database opened at schema version 1 with WAL journaling and foreign keys enabled.
- Schema: conversation and message tables, role validation, recency indexes, and cascading message deletion were exercised on the simulator.
- Queries: create, get, list, rename, delete, model update, message insert, message list, and search all returned typed records with camel-case fields.
- Ordering: message writes advanced conversation recency, rename did not reorder rows, and a later model update moved its conversation to the top.
- Search: title and message-content matches were case-insensitive, while `%`, `_`, and `\\` remained literal user input.
- Fidelity: message content with surrounding spaces round-tripped exactly.
- Cleanup: the isolated smoke database was closed and deleted after verification; Nova's production database was not modified.
- Automated gates: 16 Bun tests passed; `bunx tsc --noEmit` passed; `bun run lint` passed.

Evidence:

- `verification/07-sqlite-smoke.json`

## Persistence - Task 8 And Phase Checkpoint

Status: passed on 2026-07-16.

- Creation boundary: the first accepted send atomically created its conversation and user message; launching and abandoning an unsent new chat created no row.
- Title: the first prompt became `Write a long story about a lighthouse...`, normalized and capped at 40 characters.
- Stop boundary: stopping the long response persisted the 6,096-character assistant partial as a completed message without writing per stream chunk.
- Relaunch: terminating and relaunching the native app retained one conversation, its `gpt-5.6-luna` model, the 105-character user message, and the stopped assistant partial.
- Launch behavior: the relaunched app intentionally landed on a fresh `How can I help?` chat while leaving history available for the drawer.
- Restore behavior: the temporary checkpoint jump reopened the persisted conversation from SQLite, restored both messages, and placed the long transcript at the exact bottom. The temporary jump was removed before the final gates.
- Runtime: a final cold relaunch produced no JavaScript warnings or errors.
- Automated gates: 18 Bun tests passed; `bunx tsc --noEmit` passed; `bun run lint` passed; `git diff --check` passed.

Evidence:

- `verification/08-persistence-relaunch.json`
- `verification/08-restored-history-light.png`
- `verification/08-fresh-launch-with-history-light.png`

Code-quality review:

- Correctness: session-version guards prevent an old stream from mutating a newly opened chat; abort before content removes the empty assistant, while abort after content persists the partial response.
- Data integrity: the first conversation and user message share one exclusive transaction, and multi-message move-on writes are atomic before a new request starts.
- Security: every SQL value is bound through SQLite parameters, and persisted provider errors remain generic user-visible state rather than database content.
- Performance: SQLite writes occur only at turn boundaries; stream chunks continue to update in memory, and the list follows exact measured content height only while the user has not opted out by dragging.

## Conversation Drawer - Task 9

Status: passed on 2026-07-16.

- Header control: the 44-point sidebar button opens the drawer while preserving Nova's centered title.
- Interactive motion: a slow 17.5% edge drag tracked the finger and settled closed; a 63.5% drag settled open; a full leftward drawer drag closed it.
- Dismissal: the dimmed overlay and explicit close control both close the drawer.
- Accessibility: opening the drawer hides the chat controls from the accessibility tree and exposes only the drawer dismissal controls.
- Responsive shell: width is capped at 360 points, remains at least 280 points, and uses 86% of narrower screens.
- Runtime: a clean app restart produced no JavaScript warnings or errors.
- Automated gates: 20 Bun tests passed; `bunx tsc --noEmit` passed; `bun run lint` passed.

Evidence:

- `verification/09-drawer-open-light.png`

Code-quality review:

- Correctness: velocity takes priority over the halfway threshold, cancelled gestures always settle, and opening is limited to a 24-point leading-edge target.
- Accessibility: the overlay and close button share an explicit dismissal label, and background descendants cannot receive focus while open.
- Maintainability: pure clamp and settlement rules are isolated from the animated shell and covered by focused tests.
- Performance: one shared progress value drives translation and opacity on the UI thread; React state changes only at transition boundaries.
