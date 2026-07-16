# Nova Definition Of Done

Final audit date: 2026-07-16

## Prompt Checklist

- [x] App builds and launches with no errors or warnings at startup. The final incremental iOS build completed with 0 errors and 0 warnings, the production iOS bundle exported successfully, and a cold-launch Argent log registry contained 0 entries.
- [x] Sending a message returns a streamed real-backend reply incrementally. The final `hey nova, introduce yourself` run exposed a partial sentence before completion and then rendered the complete reply. Evidence: `14-intro-stream-complete-light.png`, `03-generating-light.png`, `03-basic-stream-light.png`.
- [x] Stop cancels generation and keeps the partial reply. In the final long-response run, stop was tapped while the continuation was visible; `Send message` returned, the transcript stayed at 71%, and the partial remained. Evidence: `14-stop-partial-light.png`, `03-stop-partial-light.png`.
- [x] Scroll anchoring follows a growing reply without hijacking manual reading. The final long-response run reached 55 pages, a manual drag held at 71%, and the recovery control remained visible while more text arrived. Evidence: `14-scrollup-midstream-light.png`, `04-stream-anchored-light.png`, `04-manual-scroll-light.png`.
- [x] Keyboard show, hide, and interactive dismissal keep the composer attached. Portrait, multiline, landscape, dark-mode, and final interactive-drag checks passed. Evidence: `05-keyboard-attached-light.png`, `05-multiline-keyboard-light.png`, `05-landscape-keyboard-light.png`, `13-keyboard-dark.png`.
- [x] Drawer opens through the header and an interactive leading-edge swipe. Partial drags tracked the finger, threshold and velocity settling passed, the overlay dimmed the chat, and the overlay and close control dismissed it. Evidence: `09-drawer-open-light.png`.
- [x] Two or more conversations restore independently from the drawer. The lighthouse and Saturn histories were created, ordered newest first, and reopened with their complete messages. Evidence: `10-two-conversations-light.png`, `10-restored-conversation-light.png`.
- [x] Rename, delete, and search work in the drawer. Title and message-content searches passed, rename survived relaunch, and deleting the active conversation cascaded its messages and returned to an empty chat. Evidence: `11-rename-search-light.png`, `11-active-delete-light.png`.
- [x] Model selection is per conversation and the route rejects unknown models. Luna, Sol, and Terra were exercised; Sol and Terra restored independently after relaunch; a final off-list POST returned HTTP 400 with `Invalid request.` Evidence: `12-model-picker-light.png`, `12-sol-conversation-light.png`, `12-terra-conversation-light.png`, `02-api-invalid.txt`.
- [x] Relaunch preserves conversations, titles, messages, partial replies, and model choices. SQLite inspection and cold native relaunches verified the records while Nova still opened to a fresh unsaved chat. Evidence: `08-persistence-relaunch.json`, `08-restored-history-light.png`, `08-fresh-launch-with-history-light.png`.
- [x] Light and dark modes follow appearance changes live. Empty chat, long chat, drawer, model picker, keyboard, loading, and error surfaces were inspected in both modes. Evidence: `13-empty-light.png`, `13-empty-dark.png`, `13-conversation-dark.png`, `13-drawer-dark.png`, `13-model-picker-dark.png`, `13-keyboard-dark.png`.
- [x] Error and retry behavior is readable and recoverable. A stopped local API produced the inline offline error, restart plus Retry completed the same turn, and an injected reader failure retained partial text with the error beneath it. Evidence: `06-offline-error-light.png`, `06-midstream-error-light.png`, `06-error-dark.png`.
- [x] Fresh launch shows an intentional empty state. Cold relaunch opened `How can I help?` with Luna and no saved empty row. Evidence: `13-empty-light.png`, `13-empty-dark.png`.

## Judging Script

1. Passed: `hey nova, introduce yourself` streamed from the real `/chat` route and completed.
2. Passed: a long reply grew to dozens of pages, manual scrolling was not hijacked, and stop restored the send state with partial content retained.
3. Passed: unavailable local API produced inline error; restoring it and tapping Retry completed the turn.
4. Passed: multiple conversations were created, renamed, searched by title and content, reopened, and deleted.
5. Passed: per-conversation Sol and Terra choices survived native termination and relaunch.

## Release Gates

- 24 Bun tests passed across 8 files with 45 assertions.
- `bunx tsc --noEmit`, `bun run lint`, and `git diff --check` passed.
- Incremental iOS native build passed with 0 errors and 0 warnings.
- Production iOS Hermes export passed.
- Exported client bundle scan found no `OPENAI_API_KEY` reference or key-like token.
- `.env` is ignored and untracked; `.env.example` is the only tracked environment file.
- `src/app/chat+api.ts` is the only tracked API route.
- Final invalid-model route probe returned HTTP 400 and `Invalid request.`
- Final cold-launch and restored 18-page scroll stress checks produced 0 Argent runtime log entries.

## Evidence Index

All evidence is stored in `verification/`. Detailed per-task observations and code-quality gates are recorded in `checkpoints.md`.
