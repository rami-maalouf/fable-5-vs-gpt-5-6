# spec: nova - ai chat app (expo, full stack)

(phase-1 spec of the spec-driven workflow. source of truth for every decision below.
the contestant prompt `test-2-ai-chat-app.md` is the functional ground truth; this
spec expands it into an implementable architecture. if they disagree, the prompt's
functional + backend specs win.)

## objective

build a production-quality ai chat app for ios with expo, full stack in one repo:

- **native feel at chatgpt-app level**: keyboard-attached composer with interactive
  dismissal, flawless scroll anchoring during streaming, interactive edge-swipe
  drawer, safe areas, live light/dark, smooth animations, haptics
- **real backend**: an expo router api route (`chat+api.ts`) that streams replies
  from the openai agents sdk; the api key never reaches the client
- **full conversation management**: sidebar drawer with history, search, rename,
  delete, per-conversation model choice, sqlite persistence across relaunches
- scope is exactly the prompt's functional spec - no settings, no onboarding, no
  auth, no markdown rendering, nothing beyond it

user = mobile developers judging on real devices against the chatgpt ios app.
success = every definition-of-done item in the prompt verified on the simulator,
plus the judging script (below) passing on a device.

## ground truth

- `test-2-ai-chat-app.md` - functional spec (10 items), backend spec (6 items),
  definition of done (13 checks). normative.
- the chatgpt ios app screenshots (empty state, conversation, mid-stream, keyboard
  up, dark mode) - layout conventions to match; branding is ours to choose.
- the judging script (from run-protocol, fixed): 1) "hey nova, introduce yourself"
  (basic streaming); 2) long-reply prompt - scroll anchoring, scroll up mid-stream,
  hit stop; 3) airplane mode -> send -> error + retry; 4) create second
  conversation, rename, search, jump between the two, delete one; 5) switch model
  in header, kill app, relaunch - everything persists.

## decisions

- **app identity: "Nova"** (matches the agent persona). minimal, native-first look:
  ios semantic colors (systemBackground family) so dark mode is free and intentional,
  sf pro, chatgpt-style message layout - user messages in filled bubbles right-aligned,
  assistant replies as plain full-width text, no bubble. no custom branding beyond an
  accent color and app icon. (open question 1 if rami wants a different identity.)
- **native components over re-implementations** wherever possible (prompt rule):
  system context menus, native navigation header, system spinners.
- **streaming client via `expo/fetch`**: react native's built-in fetch cannot read a
  response body incrementally; expo's fetch exposes a web ReadableStream. this is
  load-bearing - spike it first.
- **stop = AbortController**: aborting the fetch cancels the in-flight response;
  the partial text is kept and saved with a `stopped` status.
- **drawer is custom (reanimated + gesture-handler)**, not react-navigation drawer:
  the interactive edge swipe that tracks the finger and the dim-behind overlay are
  judged directly; owning the gesture keeps it at 60fps and chatgpt-faithful.
- **keyboard via react-native-keyboard-controller**: the composer must move with the
  keyboard with no gap/lag/jump and support interactive dismissal; plain
  KeyboardAvoidingView does not survive that bar.
- **message list: FlatList with `maintainVisibleContentPosition`** + a pinned-to-
  bottom controller (auto-follow while streaming unless the user has scrolled up;
  never hijack a manual scroll). spike alternatives (inverted list) only if this
  fails.

## tech stack

| concern | choice | notes |
|---|---|---|
| framework | expo sdk 57, typescript strict, expo-router | starter repo already includes @expo/ui + expo-widgets (unused here) |
| backend | expo router api route `src/app/chat+api.ts`, `"web": {"output": "server"}` | dev server serves it; no separate deploy needed |
| llm | `@openai/agents` streaming | config pinned by the prompt (agent Nova, verbatim instructions, model allowlist) |
| streaming client | `expo/fetch` + ReadableStream + TextDecoder | AbortController for stop |
| persistence | expo-sqlite | conversations + messages + model choice |
| state | zustand | chat session state, drawer state |
| keyboard | react-native-keyboard-controller | interactive dismiss |
| gestures/animation | react-native-gesture-handler + reanimated 4 | drawer, bubble entrance |
| haptics | expo-haptics | light impact on send |
| context menu | zeego (native ios context menu) | long-press rename/delete; swipe-to-delete additionally ok |
| testing | jest-expo + @testing-library/react-native | plus the manual judging script |

## commands

(run from the app root; bun everywhere)

```
add dep:   bunx expo install <pkg>
dev run:   bunx expo run:ios        # api route needs the dev server: bunx expo start
test:      bun run test
lint:      bunx expo lint
typecheck: bunx tsc --noEmit
```

`OPENAI_API_KEY` lives in `.env` (gitignored). expo strips secrets from `+api.ts`
client bundles; never import server code from client files, never log the key.

## project structure

```
<app root>/
  src/
    app/                     # expo-router (this repo keeps routes in src/app/)
      _layout.tsx            # providers: keyboard, gesture root, theme
      index.tsx              # chat screen (the only screen) + drawer overlay
      chat+api.ts            # POST /chat - the streaming api route
    components/
      chat/                  # MessageList, MessageRow, Composer, StreamingText,
                             # EmptyState, ErrorRow, ModelPickerSheet
      drawer/                # Drawer, ConversationRow, SearchField
    data/                    # sqlite: db.ts, conversation-repo.ts, message-repo.ts
    domain/                  # pure ts: title derivation, search filter, model
                             # allowlist, message status types
    hooks/                   # useChatStream (fetch/abort/chunks), usePinnedScroll
    state/                   # zustand stores
    theme/                   # semantic tokens (light/dark), spacing scale
  tests/
```

## code style

```ts
// stream consumption is isolated in one hook; ui components never touch fetch
export function useChatStream() {
  const abortRef = useRef<AbortController | null>(null);
  // stop() aborts the request; the caller persists the partial reply as 'stopped'
  const stop = () => abortRef.current?.abort();
  ...
}
```

- lowercase comments, no emojis, hyphens not em dashes
- domain layer pure ts (title truncation, search, allowlist) - unit-testable in node
- conventional commits, one per task

## data model (expo-sqlite)

**`conversations`**

| column | type | notes |
|---|---|---|
| id | text pk | uuid |
| title | text | auto from first user message, ~40 chars truncated |
| model | text | one of the allowlist; default `gpt-5.6-luna` |
| created_at / updated_at | integer | epoch ms; drawer sorts by updated_at desc |

**`messages`**

| column | type | notes |
|---|---|---|
| id | text pk | uuid |
| conversation_id | text fk | cascade delete |
| role | text | 'user' or 'assistant' |
| content | text | plain text only |
| status | text | 'complete', 'stopped', 'error' (assistant only) |
| created_at | integer | epoch ms |

**invariants:**

- a conversation is only persisted once it has at least one message; app launches
  into a fresh unsaved conversation with the empty state
- title = first user message, truncated to ~40 chars (word-boundary aware, ellipsis)
- model choice is per conversation and sent with every request
- a stopped or errored assistant message keeps its partial content
- search matches title OR message content, case-insensitive
- drawer order: newest first by updated_at

## backend (`src/app/chat+api.ts` - the prompt's backend spec, verbatim constraints)

- POST `{ messages, model }`; validate model against
  [`gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`], 400 otherwise
- `@openai/agents`: agent name `Nova`, instructions verbatim from the prompt
  (warm/sharp/curious, 1-3 short paragraphs, plain text, light follow-up question),
  model = validated request model, streaming on; pipe the token stream into a
  plain-text streamed Response
- `OPENAI_API_KEY` from env only; no server db, no auth, no other endpoints
- client calls relative `fetch('/chat')`

## interaction spec (what "feels native" means, testably)

1. **composer**: multiline, grows to a cap; send disabled when empty; send clears
   input immediately and does not restore on error; stop button replaces send while
   generating; sending disabled while generating; light haptic on send.
2. **streaming render**: loading indicator between send and first token; tokens
   append incrementally as chunks arrive (throttle re-renders to ~30-60ms batches so
   long replies stay smooth).
3. **scroll**: pinned to bottom while the newest message grows; a manual scroll up
   disengages auto-follow (a scroll-to-bottom pill appears); scrolling is never
   hijacked mid-stream; interactive keyboard dismissal by dragging down on the list.
4. **drawer**: edge swipe tracks the finger 1:1 and can be flung; header button
   opens it; chat dims behind (tap dim to close); 60fps both ways.
5. **conversation management**: long-press context menu (native) with rename
   (alert prompt) and delete (destructive, confirm); search filters live; new-chat
   button resets to the fresh empty conversation; tapping a conversation loads its
   history and model.
6. **model picker**: header shows current conversation's model; tapping opens a
   picker (action sheet or native menu) with exactly the three options.
7. **errors**: network/server failure renders a readable inline error under the
   (partial) reply with a retry affordance; retry re-sends the failed turn; airplane
   mode is the canonical test.
8. **theming**: ios semantic colors; light/dark follow the system live; correct
   status bar style in both; no layout flash on launch.

## testing strategy

- **unit (domain)**: title truncation (word boundary, unicode), search filter,
  allowlist validation, message status transitions, store operations.
- **route test**: chat+api.ts model validation returns 400 off-list (invoke handler
  directly with a mocked agents sdk); key never present in any client bundle
  (grep the export).
- **hook tests**: useChatStream chunk assembly + abort behavior with a mocked
  stream.
- **manual protocol**: the 5-step judging script (ground truth section) run on the
  simulator per checkpoint, on a physical device at the end; definition-of-done
  checklist from the prompt walked with screenshot evidence.
- `bun run test` + `bunx tsc --noEmit` green before every commit.

## build priorities (order for the plan)

1. app boots: chat screen shell, composer, theming skeleton.
2. backend route + streaming e2e (the riskiest integration - spike first).
3. sqlite persistence: conversations, messages, fresh-launch rule, titles.
4. drawer: gesture, list, search, new chat, jump; rename/delete.
5. model picker + per-conversation model + route validation.
6. resilience: stop/abort, error + retry, partial persistence.
7. native-feel hardening: scroll anchoring, keyboard, haptics, animations,
   light/dark audit, empty/loading states.

## risks and early spikes

1. **expo/fetch streaming**: verify a ReadableStream from the api route renders
   incrementally on the simulator (dev server). ~20-line spike before anything else
   depends on it. fallback: expo-fetch polyfill or SSE-style chunked reads.
2. **@openai/agents in the api route runtime**: verify it runs under the expo dev
   server (node). fallback (pre-agreed): plain `openai` sdk streaming call with the
   same persona baked into a system prompt - note it in DEVIATIONS.md.
3. **keyboard-controller + maintainVisibleContentPosition interplay**: prototype the
   composer + list + interactive dismiss together early; this combination is where
   chat apps usually break.
4. **drawer gesture vs list gestures**: edge-swipe must not fight horizontal
   gestures in the list or the ios back-swipe; test on device.

## boundaries

- **always:** stay inside the prompt's scope (build exactly the functional spec, no
  extra features); native components over custom; bun for everything; conventional
  commits, one per task; verify on the simulator before checking any item; keep the
  api key server-side only.
- **ask first:** any dependency beyond the stack table; any scope addition; visual
  identity changes beyond the Nova defaults.
- **never:** put the key in client code or logs; add server-side storage or
  endpoints beyond `/chat`; copy an existing chat template's code (docs are fine);
  markdown rendering (explicitly out of scope).

## success criteria

the prompt's 13-item definition of done, verified with evidence, plus:

- [ ] judging script (5 steps) passes on the simulator without intervention
- [ ] route rejects off-allowlist models with 400 (tested)
- [ ] `bun run test` and `bunx tsc --noEmit` green
- [ ] no dropped frames in drawer open/close and streaming scroll (fps overlay)
- [ ] DEVIATIONS.md lists every judgment call (including agents-sdk fallback if
      taken)

## open questions

1. app identity: "Nova" with ios-semantic minimal look - confirm or supply branding.
2. spike results: expo/fetch streaming, agents sdk in the route runtime.
3. long-reply throttling target (30-60ms batches) - tune on device if judges notice
   jank.
