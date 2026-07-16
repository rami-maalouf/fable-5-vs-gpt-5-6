# definition-of-done walk (spec.md, 13 items)

every item checked on the ios simulator (iphone 17 pro, ios 26.5, udid
B47A3DF3-056A-4531-B9FA-8327C7C8A485), dev server on port 8123 (see
DEVIATIONS.md #0 for why the port is non-default in THIS dev environment; a
clean machine needs no port flag). date: 2026-07-16.

1. [x] app builds and launches with no errors or warnings in the console at
   startup. `bunx expo run:ios` build: "0 error(s), 0 warning(s)". cold-launch
   console capture showed only framework/devtools lines, zero app warnings;
   js console log registry empty after a full send/reply cycle.
   evidence: checkpoint-1-shell-empty-state-light.png, session build logs.

2. [x] sending a message returns a streamed reply from the real backend route,
   rendered incrementally. real @openai/agents run behind POST /chat; wire
   measurement showed 36 discrete chunks for one short reply; tokens visibly
   accumulate on screen with a ~40ms render batch.
   evidence: 01-intro-streaming-light.png,
   checkpoint-2-sent-loading-dot-stop-button.png,
   checkpoint-2-streamed-reply-step1.png.

3. [x] stop cancels generation mid-stream, keeps the partial reply, ui
   recovers cleanly. partial ends mid-sentence, persisted with
   status='stopped' (1050 chars), send button restored.
   evidence: 02-stop-partial-light.png + sqlite query in checkpoint 6.

4. [x] scroll anchoring holds while a long reply streams; manual scroll-up
   mid-stream is not hijacked. verified live during a 20-paragraph stream;
   scroll-to-bottom pill appears when follow disengages, tap returns+re-arms.
   evidence: 02-scrollup-midstream-light.png, 14-scroll-to-bottom-pill.png,
   14-pill-tap-returns-to-bottom.png.

5. [x] keyboard show, hide, and interactive dismiss keep the composer attached
   with no gaps or jumps. keyboard-controller KeyboardAvoidingView
   translate-with-padding + interactive keyboardDismissMode.
   evidence: checkpoint-2-composer-keyboard-attached.png,
   checkpoint-2-interactive-dismiss-settled.png.

6. [x] drawer opens via header button and interactive edge swipe with no jank.
   custom reanimated + gesture-handler; ui-thread worklets; finger-tracked
   1:1 with fling; dim overlay tap-to-close.
   evidence: checkpoint-4-drawer-open-dim.png. (fps overlay itself not
   automatable here - honest gap noted in checkpoints.md #7.)

7. [x] two+ conversations: jumping between them from the drawer restores each
   history correctly. verified repeatedly incl. after kill+relaunch.
   evidence: 05-model-persists-relaunch-light.png,
   checkpoint-5-luna-restored-after-relaunch.png.

8. [x] rename, delete, and search verified in the drawer. native long-press
   context menu (UIContextMenu via @expo/ui swift-ui), native Alert.prompt
   rename, destructive confirm delete with cascade (0 orphaned rows), live
   search over title AND message content.
   evidence: 04-context-menu-light.png, 04-search-light.png,
   checkpoint-4-rename-prompt.png, checkpoint-4-delete-confirm.png,
   checkpoint-4-delete-active-resets-to-empty.png.

9. [x] model switched in the header; each conversation keeps its own choice;
   server rejects invalid models. native menu with exactly the three ids;
   per-conversation model persisted; curl 400 for off-list; client store
   guard unit-tested; all three ids verified live against the api.
   evidence: checkpoint-5-model-menu-three-options.png + checkpoint 1/5 logs.

10. [x] kill and relaunch: conversations, titles, messages, and model choices
    all persist. sqlite inspected directly after simctl terminate; ui
    restore verified through the drawer.
    evidence: 05-model-persists-relaunch-light.png, checkpoint-3-*.png.

11. [x] light and dark mode verified with screenshots, including a LIVE
    system flip mid-session. evidence: 16-empty-state-light.png,
    16-conversation-light.png, 16-drawer-light.png,
    16-conversation-dark-live-switch.png, 16-drawer-dark.png,
    16-empty-and-model-menu-dark.png.

12. [x] error state verified: dev-server taken down (simulator-equivalent of
    airplane mode), inline error row + retry beneath the failed turn,
    composer text not restored, retry succeeds after the network returns.
    evidence: 03-error-retry-light.png, checkpoint-6-retry-succeeded.png.

13. [x] empty state verified on fresh launch (history only via the drawer,
    unsent chats never saved). evidence:
    checkpoint-3-fresh-empty-state-after-relaunch.png,
    16-empty-state-light.png.

final summary with judgment calls: ../SUMMARY.md. deviations: ../DEVIATIONS.md.
checkpoint log: ../checkpoints.md.
