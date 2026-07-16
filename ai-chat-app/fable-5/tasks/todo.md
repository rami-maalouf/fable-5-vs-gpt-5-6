# todo: nova - ai chat app

per-task checklist for `plan.md`; `test-2-spec.md` is normative. standing definition
of done for every task: `bun run test` green, `bunx tsc --noEmit` clean, app still
boots, one conventional commit, judgment calls logged in DEVIATIONS.md.

## phase 1: foundation + riskiest integration

- [x] **task 1: repo check + deps + shell**
  - description: confirm the working dir is the expo sdk 57 starter (routes in
    `src/app/`); install stack deps (keyboard-controller, gesture-handler,
    reanimated, expo-sqlite, expo-haptics, zustand, zeego, jest-expo); wire
    `_layout.tsx` providers (gesture root, keyboard, theme); chat screen skeleton
    with header; `"web": {"output": "server"}` in app.json; `.env` with
    `OPENAI_API_KEY` present and gitignored.
  - acceptance: `bunx expo run:ios` boots to an empty chat screen with header;
    dark/light semantic tokens render.
  - verify: boot on simulator; `bunx tsc --noEmit`.
  - depends: none. files: src/app/_layout.tsx, src/app/index.tsx, src/theme/*,
    app.json, package.json. size: M

- [x] **task 2: domain + data layer**
  - description: pure-ts domain (`title from first user message` word-boundary
    truncation ~40 chars, case-insensitive search over title+content, model
    allowlist + default, message status types); expo-sqlite schema per spec
    (conversations, messages, cascade delete) + repos.
  - acceptance: unit tests: truncation (short/long/unicode/whitespace), search
    (title hit, content hit, miss), allowlist, repo round-trip incl. cascade
    delete and updated_at ordering.
  - verify: `bun run test -- domain data`.
  - depends: 1. files: src/domain/*, src/data/*, tests. size: M

- [x] **task 3: spike - streaming backbone (route + client)**
  - description: `src/app/chat+api.ts` per the spec's backend section (allowlist ->
    400, agent Nova verbatim instructions, streamed plain-text response) + a
    minimal client read via `expo/fetch` ReadableStream into a debug view. verify
    @openai/agents runs in the route runtime; if not, fall back to plain openai sdk
    streaming (record in DEVIATIONS.md).
  - acceptance: tokens visibly stream into the debug view on the simulator; 400 on
    off-list model (unit test with mocked sdk); key absent from client bundle.
  - verify: `bun run test -- route`; manual stream on simulator.
  - depends: 1. files: src/app/chat+api.ts, src/hooks/useChatStream.ts (skeleton),
    tests. size: M

**checkpoint 1:** shell boots, tests green, real streaming proven, runtime decision
recorded.

## phase 2: core chat

- [x] **task 4: composer**
  - description: multiline input with growth cap, send button (disabled when
    empty), stop button swap while generating, sending disabled while generating,
    clears on send without restore-on-error, light haptic on send.
  - acceptance: all button states reachable; component test for
    disabled/swap/clear logic.
  - verify: `bun run test -- composer`; manual on simulator.
  - depends: 1. files: src/components/chat/Composer.tsx, tests. size: M

- [x] **task 5: message list + streaming render**
  - description: FlatList with maintainVisibleContentPosition; user messages as
    filled right-aligned bubbles, assistant as plain full-width text (chatgpt
    convention); useChatStream completed: chunk batching (~30-60ms), loading
    indicator between send and first token, message appended incrementally;
    conversation state in zustand.
  - acceptance: judging step 1 message streams in smoothly end to end; hook test:
    chunk assembly with mocked stream.
  - verify: `bun run test -- stream`; manual send on simulator.
  - depends: 3, 4. files: src/components/chat/MessageList.tsx, MessageRow.tsx,
    src/hooks/useChatStream.ts, src/state/*. size: M

- [x] **task 6: keyboard integration**
  - description: react-native-keyboard-controller wiring: composer moves with the
    keyboard (no gap/lag/jump), interactive dismissal dragging down on the list,
    safe areas correct with keyboard up.
  - acceptance: show/hide/interactive-dismiss keep composer attached; no jumps on
    focus while streaming.
  - verify: manual keyboard sweep on simulator (slow animations on).
  - depends: 4, 5. files: src/app/index.tsx, Composer, MessageList. size: S

**checkpoint 2:** judging step 1 passes; keyboard behavior clean.

## phase 3: persistence

- [x] **task 7: persistence wiring**
  - description: messages/conversations persist through the repos; a conversation
    is created in the db only on its first message (fresh-launch rule: app opens
    into an unsaved empty conversation); title auto-derives from the first user
    message; assistant partials save with status; updated_at bumps on activity.
  - acceptance: kill + relaunch restores conversations, messages, titles; fresh
    launch shows the empty state, not the last conversation.
  - verify: `bun run test -- persistence`; manual kill/relaunch.
  - depends: 2, 5. files: src/state/*, src/data/*, tests. size: M

**checkpoint 3:** relaunch restores everything; empty state on fresh launch.

## phase 4: drawer

- [x] **task 8: drawer shell + gesture**
  - description: custom drawer (reanimated + gesture-handler): slides over the
    chat from the left, dim overlay (tap to close), interactive edge swipe
    tracking the finger with fling, header button toggle; must not fight list
    scrolling.
  - acceptance: 60fps open/close both ways; gesture + button + dim-tap all work.
  - verify: manual with fps overlay / perf monitor.
  - depends: 6. files: src/components/drawer/Drawer.tsx, src/state/drawer.ts.
    size: M

- [x] **task 9: conversation list + search + new chat**
  - description: drawer content: conversations newest first, search field
    filtering by title + message content (domain filter), new-chat button (resets
    to fresh unsaved conversation), tapping a conversation loads its history and
    model.
  - acceptance: judging-step-4 navigation parts pass (create second conversation,
    search finds it, jump between the two restores each history).
  - verify: `bun run test -- search`; manual two-conversation walk.
  - depends: 7, 8. files: src/components/drawer/*, src/state/*. size: M

- [x] **task 10: rename + delete**
  - description: native long-press context menu (zeego) with rename (alert text
    prompt) and delete (destructive + confirm); swipe-to-delete optional extra;
    deleting the open conversation resets to fresh empty state.
  - acceptance: rename persists and re-sorts; delete cascades messages; context
    menu feels native (no custom popover).
  - verify: manual; `bun run test -- repo` (cascade covered in task 2).
  - depends: 9. files: src/components/drawer/ConversationRow.tsx. size: S

**checkpoint 4:** judging step 4 passes end to end at 60fps.

## phase 5: model picker

- [x] **task 11: model selection**
  - description: header shows current conversation's model; tap opens a native
    picker with exactly `gpt-5.6-luna` (default), `gpt-5.6-sol`, `gpt-5.6-terra`;
    choice stored per conversation and sent with every request; route 400 already
    enforced (task 3) - add an integration test that the client never sends an
    off-list value.
  - acceptance: judging step 5 passes (switch, kill, relaunch, per-conversation
    choice survives).
  - verify: `bun run test -- model`; manual switch + relaunch.
  - depends: 7. files: src/components/chat/ModelPicker.tsx, header, state. size: S

**checkpoint 5:** judging step 5 passes; allowlist enforced both sides.

## phase 6: resilience

- [x] **task 12: stop + partial save**
  - description: stop aborts the in-flight fetch (AbortController), keeps the
    partial reply in place, saves it with status `stopped`, ui returns to
    sendable state cleanly.
  - acceptance: judging step 2's stop beat passes; hook test: abort mid-chunks
    preserves assembled text.
  - verify: `bun run test -- stream`; manual stop mid-long-reply.
  - depends: 5, 7. files: src/hooks/useChatStream.ts, state. size: S

- [x] **task 13: error states + retry**
  - description: network/server failure renders a readable inline error beneath
    the (partial) reply with retry; retry re-sends the failed turn; stream death
    mid-reply keeps partial text with error beneath; composer text not restored;
    loading state covers send-to-first-token.
  - acceptance: judging step 3 passes (airplane mode -> error -> retry succeeds
    after network returns).
  - verify: manual airplane-mode run; hook test for error propagation.
  - depends: 12. files: src/components/chat/ErrorRow.tsx, useChatStream, state.
    size: M

**checkpoint 6:** judging steps 2 and 3 pass.

## phase 7: native-feel hardening

- [ ] **task 14: scroll anchoring**
  - description: pinned-to-bottom controller: auto-follow while the newest message
    grows; manual scroll-up disengages follow and shows a scroll-to-bottom pill;
    resuming at bottom re-engages; never hijacks a manual scroll mid-stream.
  - acceptance: judging step 2's scroll beats pass (long reply, scroll up
    mid-stream, no fighting).
  - verify: manual long-reply run; hook test for follow-state transitions.
  - depends: 5. files: src/hooks/usePinnedScroll.ts, MessageList. size: M

- [ ] **task 15: animations + launch polish**
  - description: message send/appear animations, smooth streaming text growth,
    drawer timing curve, correct status bar style per mode, no layout flash on
    launch, touch targets >= 44pt audit.
  - acceptance: no visible jank with fps overlay; cold launch clean.
  - verify: manual sweep, fps overlay.
  - depends: checkpoint 6. files: chat + drawer components. size: S

- [ ] **task 16: light/dark + empty state audit**
  - description: both modes verified live-switching mid-session; empty state
    (fresh launch) intentional and matching the chatgpt-app convention; dim
    overlay, bubbles, errors, drawer all checked in both modes.
  - acceptance: screenshot pair per mode with no unreadable or default-looking
    surfaces.
  - verify: manual with system-setting flip; screenshots saved.
  - depends: 15. files: theme tokens, components. size: S

**checkpoint 7:** native-feel bar met with evidence.

## phase 8: verification sweep

- [ ] **task 17: definition-of-done sweep**
  - description: walk the contestant prompt's 13-item dod with evidence
    (screenshots/logs) per item; run the full 5-step judging script; finalize
    DEVIATIONS.md; write the summary (what was built, judgment calls, screenshot
    paths).
  - acceptance: every dod item honestly checked with evidence; no overclaiming -
    an honest partial beats a false done.
  - verify: the checklist itself + rami's independent judging-script run.
  - depends: all. files: DEVIATIONS.md, verification/. size: S

**final checkpoint:** dod complete with evidence; ready for judging.
