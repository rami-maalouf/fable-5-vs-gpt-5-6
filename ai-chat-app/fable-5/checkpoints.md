# checkpoint log

self-verification gates from `tasks/plan.md`. each entry: gate, what was
checked, evidence paths, pass/fail, and the code-quality-gate outcome.

## checkpoint 1 - foundation + streaming backbone (tasks 1-3) - PASS

date: 2026-07-16 ~03:55. device: iphone 17 pro (ios 26.5,
udid B47A3DF3-056A-4531-B9FA-8327C7C8A485), dev server on port 8123 (see
DEVIATIONS.md #0 for the shared-machine port/device story).

checked:

1. shell boots via `bunx expo run:ios` build (native build succeeded, 0 errors
   0 warnings; installed + launched; header "Nova" + empty state renders).
   evidence: verification/checkpoint-1-shell-empty-state-light.png
2. unit tests green: 33/33 across domain (title truncation, search, allowlist),
   data repos (round-trip, cascade delete, updated_at ordering), route contract
   (400 off-list/malformed, streamed text, history passthrough). `bunx tsc
   --noEmit` clean.
3. streaming proven e2e on the REAL route with the REAL @openai/agents sdk:
   - server: curl of all three allowlisted models returned live streamed
     replies; invalid model returned 400 (verified against MY server after
     discovering the port-8090 server belonged to another contestant - see
     DEVIATIONS.md #0)
   - chunking: node client measured 36 discrete chunks over the wire for one
     short reply (token-level granularity)
   - on-device: debug harness streamed "hey nova, introduce yourself" reply
     into the view incrementally; outcome complete. evidence:
     verification/checkpoint-1-streamed-reply-complete.png (+ second-run shot)
4. runtime decision recorded: @openai/agents RUNS in the expo api-route
   runtime. no fallback to plain openai sdk needed.
5. api key never reaches the client: fetched the full 9MB ios client bundle
   from the dev server; 0 occurrences of the key value, of "OPENAI_API_KEY",
   and of the server-only Nova instructions string.

code-quality gate: reviewed all code since start (layout, theme tokens, domain,
data repos, route, stream hook, debug harness). findings: duplicate expo-router
import in _layout.tsx (fixed inline); debug harness in index.tsx is temporary
by design (replaced in tasks 4-5); no dead code, naming consistent, error
handling covers abort vs failure vs http-error paths. no known quality debt
carried forward.

known deviations logged: expo/fetch relative-url resolution workaround
(DEVIATIONS.md #5).

## checkpoint 2 - core chat (tasks 4-6) - PASS

date: 2026-07-16 ~04:08. same device/server as checkpoint 1.

checked:

1. judging step 1: typed "Hey Nova, introduce yourself" in the composer, sent.
   observed in order: user message as right-aligned filled bubble, composer
   cleared immediately, typing-indicator dot during send-to-first-token, stop
   button replacing send while generating, streamed reply rendered as plain
   full-width text, send button restored (disabled on empty input) after
   completion. evidence: verification/checkpoint-2-sent-loading-dot-stop-button.png,
   verification/checkpoint-2-streamed-reply-step1.png
2. keyboard: composer attaches to the keyboard on focus with no gap
   (verification/checkpoint-2-composer-keyboard-attached.png), interactive
   drag-down dismissal settles the composer back to the safe-area bottom
   (verification/checkpoint-2-interactive-dismiss-settled.png), keyboard
   re-show keeps it attached. driven by keyboard-controller's
   KeyboardAvoidingView behavior="translate-with-padding" with
   keyboardVerticalOffset=headerHeight.
   note: screenshots capture endpoint states; frame-by-frame lag will be
   re-scrutinized in the task-15 polish pass with slow animations.
3. tests: 51/51 green (adds stream-core batching/abort/error suite, composer
   component suite, chat-store suite); tsc clean.

code-quality gate: reviewed phase-2 code (Composer, MessageRow, MessageList,
EmptyState, usePinnedScroll, useSendMessage, chat-store, screen wiring).
findings fixed inline: dead maxHeight style + unused import in Composer,
no-op model line in chat-store reset. judgment call recorded: new chat keeps
the last chosen model (chatgpt convention). remaining known debt: none.

note: @testing-library/react-native v14 has an async api (render/fireEvent
/rerender must be awaited) - earlier sync-style tests failed misleadingly with
"render function has not been called".

## checkpoint 3 - persistence (task 7) - PASS

date: 2026-07-16 ~04:12. same device/server.

checked:

1. sent "What is the capital of France?" on-device, got the streamed reply,
   killed the app (simctl terminate), then inspected the app container's
   sqlite directly: conversation row present with derived title
   "What is the capital of France?", model gpt-5.6-luna, bumped updated_at;
   both messages present with correct roles and status complete.
   evidence: verification/checkpoint-3-conversation-before-kill.png + the
   sqlite query output in the session log.
2. relaunch lands on the fresh empty state, NOT the saved conversation
   (fresh-launch rule). evidence:
   verification/checkpoint-3-fresh-empty-state-after-relaunch.png
3. unsent new chats leave no row: conversation rows are only created inside
   persistUserTurn on the first send (unit-tested; 56/56 green).

full ui-level relaunch-restore (jump back into the conversation) is exercised
at checkpoint 4 once the drawer exists.

code-quality gate: persistence module is two small functions against the repo
layer; send flow persists at message boundaries only (never per token) and
db failures degrade to console.warn without blocking chat. no debt.
