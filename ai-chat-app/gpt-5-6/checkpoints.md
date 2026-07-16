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

## Conversation Drawer - Task 10

Status: passed on 2026-07-16.

- History list: opening the drawer refreshes SQLite history and renders conversations newest first with single-line, truncated titles.
- Creation boundary: starting and abandoning a new chat kept the history list at one row and created no empty database record.
- Newest first: sending `Give me one surprising fact about Saturn's rings.` created a second row above the existing lighthouse conversation.
- Restoration: selecting the lighthouse row restored its full 6,096-character assistant response at the bottom; selecting the Saturn row restored its user and assistant messages.
- Selection: the active conversation uses the secondary system background while inactive rows remain unframed.
- Accessibility: New chat and each conversation expose explicit button labels, and the selected row exposes its selected state.
- Runtime: a clean app restart returned to a fresh chat with zero JavaScript log entries while both histories remained persisted.
- Automated gates: 20 Bun tests passed; `bunx tsc --noEmit` passed; `bun run lint` passed; `git diff --check` passed.

Evidence:

- `verification/10-two-conversations-light.png`
- `verification/10-restored-conversation-light.png`

Code-quality review:

- Correctness: refresh requests are versioned so stale SQLite results cannot overwrite a later drawer refresh or update an unmounted hook.
- Data integrity: New chat only resets in-memory state; the existing first-send transaction remains the sole conversation creation boundary.
- Accessibility: every history action has a 44-point target, semantic role, and descriptive label.
- Maintainability: the drawer shell owns motion, the conversation list owns presentation, and `useConversations` owns repository loading and failure state.

## Conversation Management - Task 11 And Phase Checkpoint

Status: passed on 2026-07-16.

- Context actions: a 350 ms row long press opens the native iOS action sheet with Rename and destructive Delete actions.
- Rename: the dialog selected the complete existing title, persisted `Northern Light Archive`, and retained the row's second-place ordering until the newer conversation was deleted.
- Search by content: `icy moon` matched only the Saturn conversation through assistant-message content even though the phrase was absent from its title.
- Search by title: `Northern` matched only the renamed lighthouse conversation; clearing restored the complete newest-first list.
- Active delete: deleting the open Saturn conversation required destructive confirmation, cascaded its messages, closed the drawer, and returned the chat to `How can I help?`.
- Persistence: after a cold relaunch, only `Northern Light Archive` remained and its renamed title was intact.
- Accessibility: search and clear actions have explicit labels, rows announce the long-press management hint, and the rename dialog isolates list descendants while open.
- Runtime: the final cold relaunch produced zero JavaScript log entries.
- Automated gates: 20 Bun tests passed; `bunx tsc --noEmit` passed; `bun run lint` passed; `git diff --check` passed.

Evidence:

- `verification/11-rename-search-light.png`
- `verification/11-active-delete-light.png`

Code-quality review:

- Correctness: debounced searches and explicit refreshes share a request-version guard, so stale query results cannot replace a newer list.
- Data integrity: rename does not touch `updated_at`; delete uses the existing foreign-key cascade; active-chat reset occurs only after the delete succeeds.
- Recovery: query, rename, delete, and refresh failures remain generic, visible, and retryable without exposing SQLite details.
- Accessibility: management actions use native system sheets and alerts, the custom rename input has a selected initial value, and all custom actions retain 44-point targets.
- Maintainability: SQLite operations remain in the repository-backed hook, while the list owns only interaction presentation and Home owns active-chat recovery.

## Model Picker - Task 12

Status: passed on 2026-07-16.

- Picker: the centered header control opens a native iOS action sheet containing exactly Luna, Sol, and Terra, with Terra identified as the current model in the captured state.
- Fresh selection: a new chat selected Sol, sent `Reply with the single word Sol.`, and rendered the streamed `Sol` response under a `Nova Sol` header.
- Request contract: the transport test verifies that `gpt-5.6-sol` is serialized in the request body; the completed native turn verifies the selected model through the live `/chat` route.
- Per-conversation state: switching between the lighthouse and Sol histories restored Terra and Sol respectively before and after a cold app relaunch.
- Persistence ordering: changing the lighthouse conversation to Terra persisted the value and moved that conversation to the top through the repository's existing activity timestamp contract.
- Allowlist: posting `gpt-5.6-unknown` directly to `/chat` returned HTTP 400 with `Invalid request.`.
- Interaction recovery: E2E reproduced dropped first taps inside the drawer's pan detector. Gesture Handler pressables plus child-touch passthrough fixed row selection and the explicit close control on the first tap.
- Accessibility: the header exposes `Model: <name>`, retains a 44-point target, and reports disabled state while generation or selection is active.

Evidence:

- `verification/12-model-picker-light.png`
- `verification/12-sol-conversation-light.png`
- `verification/12-terra-conversation-light.png`

Code-quality review:

- Correctness: saved conversations write the model to SQLite before updating visible state, session guards reject stale completion, and generation disables model changes so an in-flight request cannot change identity.
- Security: the client type restricts selections to the three known models, while the API route independently validates the same allowlist and returns a generic rejection.
- Maintainability: presentation remains isolated in `ModelPicker`, persistence remains in `useChat`, and request serialization remains in the existing transport.
- Performance: model writes occur only on explicit selection; no streaming or list-render path gained additional work.

## Native Polish - Task 13

Status: passed on 2026-07-16.

- Scroll recovery: a deliberate drag from the bottom of the five-page lighthouse transcript disengaged following at 86% and exposed the 44-point `Scroll to latest message` control. One tap returned to the exact bottom and removed the control.
- Manual control: the pure scroll policy passes boundary tests for distance measurement, disengagement above 48 points, and re-engagement at or below the threshold.
- Appearance: a live in-session switch rendered the empty state, long conversation, drawer, model action sheet, composer, keyboard, and status bar in dark mode without reloading or losing state. Restoring system appearance returned every surface to light mode.
- Existing recovery states: Task 6's captured dark error state and light loading state remain readable under the same semantic tokens.
- Keyboard and safe areas: the dark keyboard attached directly below the composer, moved the empty state into the available viewport, and left the header and status bar unobstructed.
- Motion: new message rows use a 180 ms entrance while streaming updates remain unanimated within the mounted row; drawer settling uses a 240 ms cubic ease-out while direct drags stay one-to-one.
- Launch assets: the starter icon and splash were replaced by Nova-owned app, adaptive, monochrome, light-splash, and dark-splash assets. The rebuilt native binary contains the new compiled app icon and distinct splash asset variants.
- Launch behavior: Expo's native splash receives a 220 ms fade, status-bar style is explicitly `auto`, and a clean incremental iOS build completed with 0 errors and 0 warnings.
- Runtime: a final cold relaunch returned to a fresh unsaved Luna chat and produced zero JavaScript log entries.
- Automated gates: 22 Bun tests passed; `bunx tsc --noEmit` passed; `bun run lint` passed; `git diff --check` passed.

Evidence:

- `verification/13-scroll-recovery-light.png`
- `verification/13-empty-light.png`
- `verification/13-empty-dark.png`
- `verification/13-conversation-dark.png`
- `verification/13-drawer-dark.png`
- `verification/13-model-picker-dark.png`
- `verification/13-keyboard-dark.png`
- `verification/13-compiled-app-icon.png`
- `verification/06-loading-light.png`
- `verification/06-error-dark.png`

Code-quality review:

- Correctness: only user-driven scrolling can disengage following, returning to the threshold or tapping the control restores it, and conversation changes reset the scroll policy before the first layout frame.
- Accessibility: the recovery action has an explicit label and 44-point target; all audited controls retain at least 44 points in both modes.
- Maintainability: scroll policy is isolated as pure tested functions, launch artwork retains editable SVG sources, and appearance configuration remains at the root boundary.
- Performance: scroll events are handled only during active user interaction, entrance animation runs once per row, and drawer motion remains on the UI thread.
