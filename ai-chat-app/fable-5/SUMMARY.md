# nova - final summary

a production-quality ai chat app for ios: expo sdk 57 + expo-router, full
stack in one repo. single chat screen with a chatgpt-style interactive drawer,
streaming replies from an expo api route running the real @openai/agents sdk,
sqlite persistence, per-conversation model choice.

## what was built

- **backend**: `src/app/chat+api.ts` - POST { messages, model }; model
  validated against [gpt-5.6-luna, gpt-5.6-sol, gpt-5.6-terra] (400 otherwise),
  agent "Nova" with the spec's verbatim instructions, streamed plain-text
  response (`toTextStream()` piped through TextEncoderStream). key lives in
  `.env`, never in the client bundle (grep-verified against the built 9MB
  bundle: 0 hits for the key, the env var name, or the instructions string).
- **streaming client**: `useChatStream`/`streamChat` - expo/fetch +
  ReadableStream + TextDecoder, AbortController stop, ~40ms chunk batching
  with a trailing flush.
- **chat screen**: FlatList + maintainVisibleContentPosition with a
  pinned-to-bottom controller (`usePinnedScroll`): auto-follow while
  streaming, manual scroll-up never hijacked, scroll-to-bottom pill.
  composer with send/stop swap, disabled states, clear-on-send (never
  restored), light haptic. keyboard via react-native-keyboard-controller
  (translate-with-padding + interactive dismiss).
- **drawer**: custom reanimated + gesture-handler overlay above the native
  stack header - left-edge swipe tracks the finger 1:1 with fling, dim
  overlay, header button. content: live search over titles AND message
  content (pure-ts domain filter), newest-first list, new chat, native
  long-press context menu (UIContextMenu via @expo/ui) with rename
  (Alert.prompt) and delete (destructive confirm, cascade).
- **persistence**: expo-sqlite. conversation row created on FIRST message
  only (fresh-launch rule); titles word-boundary truncated at ~40 chars from
  the first user message; stopped/errored partials persisted with status;
  updated_at drives drawer order. repos are 3-method-interface pure functions
  unit-tested against an in-memory sqlite.
- **resilience**: stop keeps the partial (status 'stopped'); network/server
  failure renders an inline error row + retry that re-sends the failed turn
  (errored reply is replaced, composer text never restored).
- **model picker**: native pull-down menu in the header title showing the
  active conversation's model; exactly three options; choice stored per
  conversation and sent with every request; allowlist enforced on BOTH sides.
- **theming**: ios semantic colors (PlatformColor) - light/dark follows the
  system live; adaptive white/black splash (no launch flash).

## verification

- 58 unit tests green (`bun run test`), `bunx tsc --noEmit` clean.
- 13-item definition of done walked with evidence: `verification/DOD.md`.
- checkpoint-by-checkpoint self-verification log with evidence paths:
  `checkpoints.md` (7 checkpoints, all pass; one honest gap - fps overlay
  numbers, mitigations documented).
- ~38 evidence screenshots in `verification/`.

## judgment calls (full detail in DEVIATIONS.md)

1. **shared-machine survival** (DEVIATIONS #0): this machine ran several
   contestant sessions concurrently; stale/live metro servers from other
   projects squatted ports 8081-8090 and my app silently loaded ANOTHER
   contestant's js bundle twice. resolution: dedicated simulator + dev server
   pinned to port 8123 with project-identity verification. nothing committed
   depends on the port; a judge on a clean machine runs plain
   `bunx expo run:ios`.
2. **zeego -> @expo/ui context menu** (DEVIATIONS #7): zeego's native
   dependency does not link against rn 0.86 (undefined `RCTRootContentView`).
   fell back to @expo/ui swift-ui ContextMenu - still a real UIContextMenu,
   zero extra deps.
3. **expo/fetch relative url** (DEVIATIONS #5): with a non-default packager
   port, expo/fetch's relative resolution hit the wrong origin; the hook
   resolves '/chat' against window.location (no hardcoded origin anywhere).
4. **@openai/agents runs in the api-route runtime** - no fallback needed;
   all three model ids verified live.
5. **new chat keeps the last chosen model** (chatgpt convention); fresh
   launch always defaults to gpt-5.6-luna.
6. test infra: jest 29 (jest-expo 57 requirement), better-sqlite3 as a
   dev-only in-memory stand-in for expo-sqlite behind a shared 3-method
   interface; RNTL v14's async api.

## how to run

```
bun install
echo "OPENAI_API_KEY=..." > .env   # gitignored; .env.example is the template
bunx expo run:ios                  # iphone pro class simulator
bun run test                       # 58 tests
bunx tsc --noEmit
```
