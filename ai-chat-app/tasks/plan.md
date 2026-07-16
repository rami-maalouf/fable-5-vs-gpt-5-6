# Implementation Plan: ai chat app (fully fledged)

spec: `../spec.md` - the source of truth. this plan implements it, nothing more.

## Overview

Build the chat app in vertical slices: get a real streamed reply on screen first (walking
skeleton), then make the chat screen feel native, then add persistence, then the drawer
and conversation management, then the model picker and final polish. Every phase ends
with the app in a working, demoable state.

## Architecture decisions

- routes live in `src/app/` (starter convention); the api route is `src/app/chat+api.ts`
- single chat screen (`src/app/index.tsx`); the active conversation is state, not a route
  param - the drawer is an overlay, not a navigator
- drawer is a custom reanimated + gesture-handler implementation (spec requires
  chatgpt-feel interactive edge swipe; stock navigator drawer doesn't clear that bar)
- streaming state lives in `use-chat.ts`; sqlite is written at message boundaries
  (user message on send, assistant message on stream end or stop), never per token
- scroll anchoring via the list's `maintainVisibleContentPosition` + pinned-to-bottom
  tracking; do not fight manual scroll-up with imperative scrollToEnd calls
- server validates the model against the allowlist; client never sends free-form strings

## Dependency graph

```
task 1 (setup: deps, server output)
   ├── task 2 (api route)
   │      └── task 3 (walking skeleton: send -> stream -> render)
   │             ├── task 4 (message list feel)
   │             ├── task 5 (composer + keyboard)
   │             └── task 6 (loading + error + retry)
   └── task 7 (sqlite layer)
          └── task 8 (wire chat to sqlite)          [needs 3]
                 ├── task 9 (drawer shell)
                 │      └── task 10 (conversation list + new chat + titles)
                 │             └── task 11 (rename + delete + search)
                 └── task 12 (model picker)
                                └── task 13 (polish audit)
                                       └── task 14 (final DoD verification)
```

## Task list

### Phase 1: walking skeleton

## Task 1: project setup

**Description:** Install `expo-sqlite` and `@openai/agents`, set `"web": { "output": "server" }`
in app.json, strip the starter's tabs/explore scaffolding down to a single index screen.

**Acceptance criteria:**
- [ ] app builds and launches on the simulator with a blank single screen
- [ ] no tab bar, no explore screen, no console warnings at startup

**Verification:** `bunx expo run:ios` launches clean; `bunx tsc --noEmit` and `bun run lint` pass.

**Dependencies:** none
**Files likely touched:** `package.json`, `app.json`, `src/app/_layout.tsx`, `src/app/index.tsx` (delete `explore.tsx`, tab components)
**Estimated scope:** S

## Task 2: streaming api route

**Description:** Implement `src/app/chat+api.ts`: POST `{ messages, model }`, validate the
model against the allowlist (400 otherwise), stream the Nova agent reply as plain text
via `@openai/agents`. Verify against current docs first - the sdk is newer than training data.

**Acceptance criteria:**
- [ ] `curl -N` against the dev server streams a reply chunk by chunk
- [ ] invalid model returns 400; missing key returns a 5xx without leaking the key
- [ ] key never appears in client bundle or logs

**Verification:** curl the route on `expo start` dev server for all three allowlisted models + one invalid.

**Dependencies:** task 1
**Files likely touched:** `src/app/chat+api.ts`
**Estimated scope:** S

## Task 3: walking skeleton - send, stream, render

**Description:** Minimal end-to-end chat: `use-chat.ts` posts the in-memory history to
`/chat`, reads the stream, renders it incrementally into an unstyled list. Stop button
aborts via AbortController and keeps the partial text.

**Acceptance criteria:**
- [ ] a sent message gets a streamed reply rendered token by token on the simulator
- [ ] stop mid-stream cancels the request; partial reply stays; ui recovers

**Verification:** manual on simulator: scenario 1 from the spec's testing strategy ("hey nova, introduce yourself") + stop mid-reply.

**Dependencies:** task 2
**Files likely touched:** `src/hooks/use-chat.ts`, `src/app/index.tsx`, `src/components/chat/message-list.tsx`, `src/components/chat/composer.tsx`
**Estimated scope:** M

### Checkpoint: skeleton
- [ ] real streamed conversation works end to end on the simulator
- [ ] typecheck + lint clean; commit

### Phase 2: native-feel chat screen

## Task 4: message list feel

**Description:** Bubbles (user vs assistant visually distinct, newest at bottom), scroll
pinned to bottom while streaming, manual scroll-up mid-stream never hijacked, empty state
for a fresh conversation.

**Acceptance criteria:**
- [ ] long streamed reply keeps the list anchored without jumps
- [ ] scrolling up mid-stream stays where the user put it
- [ ] empty state renders on fresh launch

**Verification:** scenario 2 (long story prompt; scroll up mid-stream; stop).

**Dependencies:** task 3
**Files likely touched:** `src/components/chat/message-list.tsx`, `message-bubble.tsx`, `empty-state.tsx`
**Estimated scope:** M

## Task 5: composer + keyboard

**Description:** Multiline composer pinned above the keyboard: send disabled when empty,
stop swaps in while generating, interactive keyboard dismissal, subtle haptic on send,
safe areas respected.

**Acceptance criteria:**
- [ ] keyboard show/hide/interactive-dismiss keep the composer attached, no gap or jump
- [ ] send disabled on empty input and while a reply is generating; stop replaces send while streaming; composer clears on send
- [ ] haptic fires on send

**Verification:** manual keyboard torture pass on simulator (show, hide, drag-dismiss, rotate through repeatedly).

**Dependencies:** task 3
**Files likely touched:** `src/components/chat/composer.tsx`, `src/app/index.tsx`
**Estimated scope:** M

## Task 6: loading + error + retry

**Description:** Loading indicator between send and first token; network/server failure
shows a readable inline error with a retry affordance that re-sends the failed turn. A
stream that dies mid-reply keeps the partial text with the error row beneath it. The
composer does not restore its text on error.

**Acceptance criteria:**
- [ ] visible loading state before first token
- [ ] airplane mode send shows inline error; retry works after network returns
- [ ] mid-stream failure keeps the partial reply with the error row beneath it

**Verification:** scenario 3 (airplane mode, send, retry).

**Dependencies:** task 3
**Files likely touched:** `src/hooks/use-chat.ts`, `src/components/chat/error-row.tsx`
**Estimated scope:** S

### Checkpoint: chat screen
- [ ] verification scenarios 1-3 all pass on the simulator
- [ ] light + dark quick check; commit

### Phase 3: persistence

## Task 7: sqlite layer

**Description:** `src/lib/db.ts` with the spec's schema (conversations, messages, cascade
delete), migration on first launch, and typed queries: create/list/rename/delete/search
conversations, insert/list messages, update conversation model + updated_at.

**Acceptance criteria:**
- [ ] all queries work against a seeded db (exercise via a temporary dev screen or logs)
- [ ] search matches title and message content

**Verification:** seed + query smoke test on simulator; `bunx tsc --noEmit`.

**Dependencies:** task 1
**Files likely touched:** `src/lib/db.ts`
**Estimated scope:** S

## Task 8: wire chat to sqlite

**Description:** Conversation row created on first send (title = first message truncated
~40 chars), user and assistant messages persisted at boundaries, partial reply persisted
on stop, app relaunch restores history. Launch lands on a fresh empty chat.

**Acceptance criteria:**
- [ ] kill and relaunch: the conversation and all messages come back
- [ ] unsent new chats leave no row behind
- [ ] stopped stream persists the partial reply

**Verification:** manual: chat, kill app, relaunch, reopen conversation from db (temporary jump until drawer exists).

**Dependencies:** tasks 3, 7
**Files likely touched:** `src/hooks/use-chat.ts`, `src/hooks/use-conversations.ts`, `src/app/index.tsx`
**Estimated scope:** M

### Checkpoint: persistence
- [ ] relaunch restores history; commit

### Phase 4: drawer + conversation management

## Task 9: drawer shell

**Description:** Custom drawer: slides in from the left over the chat, dim overlay,
opens from a header button and an interactive left-edge swipe that tracks the finger,
closes by swipe/tap-outside. Reanimated + gesture-handler, 60fps.

**Acceptance criteria:**
- [ ] edge swipe tracks the finger both directions; button toggles it
- [ ] no dropped frames opening/closing; chat behind dims

**Verification:** manual gesture pass; fps overlay if in doubt.

**Dependencies:** task 8
**Files likely touched:** `src/components/drawer/drawer.tsx`, `src/app/index.tsx`, `src/app/_layout.tsx`
**Estimated scope:** M

## Task 10: conversation list + new chat + titles

**Description:** Drawer lists conversations newest first with auto titles; tapping one
jumps to it (loads its history + model); new chat button opens a fresh empty conversation.

**Acceptance criteria:**
- [ ] two+ conversations: jumping between them restores each history correctly
- [ ] titles show the truncated first message
- [ ] new chat resets to the empty state without saving a row

**Verification:** scenario 4 (first half: create second conversation, jump between the two).

**Dependencies:** task 9
**Files likely touched:** `src/components/drawer/conversation-row.tsx`, `src/hooks/use-conversations.ts`, `src/app/index.tsx`
**Estimated scope:** M

## Task 11: rename, delete, search

**Description:** Long-press context menu on a conversation row with rename (inline
prompt) and delete (confirm; cascade removes messages; deleting the active conversation
falls back to a new chat). Search field filters by title and message content.

**Acceptance criteria:**
- [ ] rename persists and reorders nothing unexpectedly
- [ ] delete removes conversation + messages; active-conversation delete recovers cleanly
- [ ] search narrows the list by title and content

**Verification:** scenario 4 (second half: rename, search, delete).

**Dependencies:** task 10
**Files likely touched:** `src/components/drawer/conversation-row.tsx`, `src/components/drawer/search-field.tsx`, `src/lib/db.ts`
**Estimated scope:** M

### Checkpoint: drawer
- [ ] full verification scenario 4 passes; commit

### Phase 5: model picker + polish

## Task 12: model picker

**Description:** Chat header shows the active conversation's model; tapping opens a
picker (`gpt-5.6-luna` default, `gpt-5.6-sol`, `gpt-5.6-terra`). Choice persists per
conversation and is sent with every request.

**Acceptance criteria:**
- [ ] each conversation keeps its own model across jumps and relaunch
- [ ] the selected model reaches the backend (verify via route behavior/logs, key never logged)

**Verification:** scenario 5 (model switch + relaunch) + curl 400 check for invalid model.

**Dependencies:** task 8 (schema field exists from task 7)
**Files likely touched:** `src/components/model-picker/model-picker.tsx`, `src/app/index.tsx`, `src/hooks/use-chat.ts`
**Estimated scope:** S

## Task 13: polish audit

**Description:** Full pass on the "feels native" bar: light/dark intentional and live,
status bar style, no launch flash, safe areas, animation smoothness (send, bubbles,
streaming, drawer), touch targets.

**Acceptance criteria:**
- [ ] light and dark both look intentional; system toggle updates live
- [ ] no layout flash on cold launch
- [ ] all animations smooth on device-class simulator

**Verification:** screenshot pass light + dark of every state (empty, chatting, streaming, error, drawer open).

**Dependencies:** tasks 4-6, 9-12
**Files likely touched:** `src/constants/theme.ts` + touch-ups across components
**Estimated scope:** M

## Task 14: final verification + summary

**Description:** Run the complete definition-of-done checklist from the spec on the
simulator, capture evidence (screenshots/logs) per item, write the final summary with
judgment calls and screenshot paths.

**Acceptance criteria:**
- [ ] every DoD item independently verified with evidence
- [ ] summary written

**Verification:** the DoD checklist itself.

**Dependencies:** all
**Files likely touched:** none (verification artifacts only)
**Estimated scope:** S

### Checkpoint: complete
- [ ] full DoD green, evidence captured, ready for review

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `@openai/agents` streaming api differs from training data | High | task 2 is early and isolated; verify against current docs + curl before any ui work |
| scroll anchoring while streaming is the hardest ux item | High | isolated in task 4 with the long-reply scenario as the test; prefer `maintainVisibleContentPosition` over imperative scrolling |
| keyboard interactive dismiss without an extra library | Med | attempt native approach in task 5; if it can't clear the bar, add react-native-keyboard-controller |
| drawer edge-swipe conflicts with list gestures | Med | edge-hitbox-only gesture activation; test with the message list scrolled |
| sqlite writes during streaming cause jank | Low | write at message boundaries only, never per token |
| model ids not live | Med | curl all three ids against the route before building the picker |

## Parallelization

tasks 4, 5, 6 are independent after task 3. task 7 is independent of 2-6. everything
else is sequential per the graph. single-session build order: 1 -> 2 -> 3 -> 4 -> 5 ->
6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 13 -> 14.

## Execution context

this plan plus `../spec.md` are the full context for the implementing session; the spec
is authoritative if they ever disagree. work autonomously in the given repo, follow the
task order, and commit after every task (conventional prefixes, lowercase). verify each
checkpoint on the simulator with Argent MCP before moving on, saving evidence
screenshots to `verification/` per the spec's tooling section. any libraries you judge
necessary are allowed - record judgment calls in the final summary.
