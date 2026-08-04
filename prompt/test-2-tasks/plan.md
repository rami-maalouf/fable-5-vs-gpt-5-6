# implementation plan: nova - ai chat app (expo, full stack)

source of truth: `test-2-spec.md` alongside this plan (which itself defers to the
functional/backend specs in the contestant prompt it was derived from). this plan
sequences the work; the detailed checklist lives in `todo.md`. if plan and spec
disagree, the spec wins.

## overview

build the Nova chat app in the current working directory: a single chat screen with
a chatgpt-style drawer, streaming replies from an expo router api route running the
openai agents sdk, sqlite persistence, and native feel judged against the chatgpt
ios app (keyboard, scroll anchoring, drawer gesture, dark mode, haptics). ios is the
target; scope is exactly the spec's functional spec - nothing more.

## architecture decisions (rationale in the spec)

- **streaming isolated in one hook** (`useChatStream`): expo/fetch + ReadableStream
  + AbortController. ui components never touch fetch. stop aborts and persists the
  partial reply as `stopped`.
- **backend is one file** (`src/app/chat+api.ts`): validate model allowlist -> 400,
  run agent Nova (verbatim instructions) streaming, pipe tokens into a plain-text
  streamed response. key stays server-side.
- **pure-ts domain layer** (title truncation, search filter, allowlist, status
  transitions) so the logic that gets judged in the drawer is unit-tested.
- **custom drawer** (reanimated + gesture-handler) for the finger-tracking edge
  swipe; **react-native-keyboard-controller** for the composer;
  **FlatList + maintainVisibleContentPosition** with a pinned-to-bottom controller
  for streaming scroll.
- **native components first**: system context menus (zeego), native header, ios
  semantic colors so light/dark is intentional for free.
- **one commit per task, conventional prefixes; judgment calls in DEVIATIONS.md.**

## dependency graph

```
scaffold check (starter repo, deps)
  ├─ theme tokens + providers ─────────────┐
  ├─ domain (title/search/allowlist) ─┐    │
  │     └─ data layer (sqlite) ───────┤    │
  ├─ SPIKE: api route + expo/fetch streaming e2e (riskiest - first)
  │                                   │    │
  └─ composer ──┬─ message list + streaming render
                └─ keyboard integration (risk: interplay with list)
                      └─ persistence wiring (fresh-launch rule, titles)
                            └─ drawer (gesture -> list/search -> manage)
                                  └─ model picker + route validation
                                        └─ resilience (stop, errors, retry)
                                              └─ native-feel hardening
                                                    └─ verification sweep
```

## phases and checkpoints

### phase 1: foundation + riskiest integration (tasks 1-3)
repo/deps/shell, domain + data layers, and the streaming spike (api route +
expo/fetch + agents sdk runtime check) before anything depends on it.

**checkpoint 1:** `bunx expo run:ios` boots the shell; unit tests green; a hardcoded
prompt streams tokens from the real route into a debug text view. agents-sdk runtime
decision recorded (sdk or plain-openai fallback).

### phase 2: core chat (tasks 4-6)
composer, message list with incremental streaming render, keyboard integration.

**checkpoint 2:** judging step 1 passes ("hey nova, introduce yourself" streams
smoothly); keyboard show/hide/interactive-dismiss keeps the composer attached.

### phase 3: persistence (task 7)
sqlite wiring: conversations save on first message, titles auto-derive, relaunch
restores everything.

**checkpoint 3:** kill + relaunch restores conversation, messages, title.

### phase 4: drawer (tasks 8-10)
drawer shell + gesture, conversation list + search + new chat + jump, rename/delete.

**checkpoint 4:** judging step 4 passes (two conversations: rename, search, jump,
delete) at 60fps.

### phase 5: model picker (task 11)
header model display + picker, per-conversation persistence, route 400 validation.

**checkpoint 5:** judging step 5 passes (switch model, kill, relaunch - choices
survive; off-list model gets 400).

### phase 6: resilience (tasks 12-13)
stop/abort with partial save; loading and error states with retry.

**checkpoint 6:** judging steps 2 (stop mid-stream) and 3 (airplane mode -> inline
error -> retry) pass.

### phase 7: native-feel hardening (tasks 14-16)
scroll anchoring, animations/haptics/launch polish, light-dark + empty state audit.

**checkpoint 7:** scroll-up mid-stream is never hijacked; fps overlay clean on
drawer and streaming; both modes screenshot-verified.

### phase 8: verification sweep (task 17)
walk the prompt's 13-item definition of done with evidence, full judging script,
DEVIATIONS.md, summary.

**final checkpoint:** every dod item checked with a screenshot or log; rami runs the
judging script independently.

## risks and mitigations

| risk | impact | mitigation |
|---|---|---|
| expo/fetch can't stream incrementally in this setup | high (kills the core loop) | spike in task 3 before anything depends on it; fallback documented there |
| @openai/agents fails in the api-route runtime | high | same spike; pre-agreed fallback: plain openai sdk streaming with the Nova persona as system prompt, noted in DEVIATIONS.md |
| keyboard-controller vs maintainVisibleContentPosition interplay | med | integrated early (task 6) while the surface is small |
| drawer edge swipe fights list/back gestures | med | gesture built in isolation (task 8), tested with the list before management features pile on |
| streaming re-render jank on long replies | med | chunk batching (~30-60ms) in the stream hook from day one; tune at checkpoint 7 |

## parallelization

safe to parallelize: tasks 1/2 after the repo check; 9/10 after 8; 14/15/16.
must be sequential: 3 before 5; 5 before 6 and 14; 7 before 8; 12 before 13.
shared contract: domain types + repo interfaces (task 2) - land first, keep stable.

## open questions (carry from spec)

1. app identity "Nova" with ios-semantic minimal look - confirm or supply branding.
2. spike outcomes (task 3) - resolved at checkpoint 1.
