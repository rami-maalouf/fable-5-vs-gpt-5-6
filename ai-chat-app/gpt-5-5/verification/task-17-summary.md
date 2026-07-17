# task 17 verification summary

status: pass

## definition of done

1. App builds and launches with no errors or warnings in console at startup.
   - evidence: `evidence/task-17/01-startup-empty.png`
   - JS log registry after restart: `/Users/rami/.argent/tmp/argent-logs-8097-1784242202894.log` reported 0 entries.
2. Sending message returns streamed reply from the real backend route and renders incrementally.
   - evidence: `evidence/task-17/02-streaming-mid-reply.png`, `evidence/task-17/03-assistant-complete-no-clipping.png`
3. Stop cancels generation mid-stream, keeps partial reply, and UI recovers.
   - evidence: `evidence/task-17/05-stop-keeps-partial.png`
4. Scroll anchoring holds during long reply and manual scroll-up mid-stream is not hijacked.
   - evidence: `evidence/task-17/04-scroll-detached-mid-stream.png`
5. Keyboard show, hide, and interactive dismiss keep composer attached without visible gaps or jumps.
   - evidence: simulator keyboard sweep during retry recovery and `evidence/task-17/04-scroll-detached-mid-stream.png`
6. Drawer opens via header button and interactive edge swipe smoothly.
   - evidence: `evidence/task-17/08-drawer-multiple-conversations.png`; task 8 and task 15 checkpoint evidence cover the edge-swipe and performance sweep.
7. Two or more conversations created and drawer jump restores histories.
   - evidence: `evidence/task-17/08-drawer-multiple-conversations.png`, `evidence/task-17/10-drawer-jump-restores-history.png`
8. Rename, delete, and search verified in drawer.
   - evidence: `evidence/task-17/09-drawer-search.png`, `evidence/task-17/11-drawer-rename.png`, `evidence/task-17/12-drawer-delete.png`
9. Model switched in header, each conversation keeps its own choice, and route rejects off-list models.
   - evidence: `evidence/task-17/13-model-switched-header.png`, `evidence/task-17/14-models-per-conversation.png`
   - live route probe: `POST http://127.0.0.1:8097/chat` with `gpt-4.1` returned `400 {"error":"unsupported model"}`.
10. Kill and relaunch preserves conversations, titles, messages, and model choices.
    - evidence: `evidence/task-17/15-relaunch-drawer-persistence.png`, `evidence/task-17/16-relaunch-thread-persistence.png`
11. Light and dark screenshots exist.
    - evidence: `evidence/task-16/light-empty.png`, `evidence/task-16/light-drawer.png`, `evidence/task-16/light-conversation.png`, `evidence/task-16/light-error.png`, `evidence/task-16/dark-empty.png`, `evidence/task-16/dark-drawer.png`, `evidence/task-16/dark-conversation.png`, `evidence/task-16/dark-error.png`
12. Error state verified with inline error and retry.
    - evidence: `evidence/task-17/06-inline-error.png`, `evidence/task-17/07-retry-success.png`
13. Empty state on fresh launch.
    - evidence: `evidence/task-17/01-startup-empty.png`

## judging script

1. Fresh launch and first message: pass. Startup empty screen was clean, the first reply streamed, and assistant text wrapping was fixed and reverified with no visual clipping.
2. Long reply, manual scroll, and stop: pass. Manual scroll detached from auto-follow, the scroll-to-latest control appeared, and stopping kept a partial assistant reply while the composer returned to send state.
3. Error and retry: pass. Stopping Metro produced the inline connection error; restarting Metro and tapping Retry produced a replacement streamed assistant response.
4. Drawer workflow: pass. Multiple conversations were present, search filtered to the lighthouse thread, opening another row restored its long history, rename persisted, and delete removed the renamed row after confirmation.
5. Model and persistence: pass. Header switch to `gpt-5.6-sol` persisted on the selected conversation, other rows retained `gpt-5.6-luna` or `gpt-5.6-terra`, off-list route probe returned 400, and app restart preserved saved histories and model labels.

## gates

- `bun run test`: 18 suites, 65 tests passed.
- `bunx tsc --noEmit`: clean.
- `bunx expo lint`: clean.

## deviations

No new task 17 deviations were added. Existing judgment calls remain in `DEVIATIONS.md`.
