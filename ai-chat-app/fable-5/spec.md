# Spec: ai chat app (fully fledged)

methodology: spec-driven-development (specify -> plan -> tasks -> implement, gated on review)

## Objective

A production-quality AI chat app for iOS built on the pinned Expo SDK 57 starter. The
quality bar is the ChatGPT iOS app: it must feel equally native, reviewed by mobile
developers on real devices.

Fully fledged means: a chat screen with streaming replies, a ChatGPT-style sidebar
drawer with persistent conversation history you can jump between, per-conversation model
selection, and conversation management (rename, delete, search). Not just a chat
interface.

Success = every definition-of-done item verified with evidence, plus the feel test:
keyboard handling, scroll anchoring mid-stream, drawer gesture, light/dark.

## Tech stack

- expo ~57.0.6, expo-router ~57.0.6 (typed routes, react compiler enabled)
- react 19.2.3, react-native 0.86.0, typescript ~6.0.3
- expo-sqlite (to be installed) - local persistence for conversations/messages
- @openai/agents (to be installed) - streaming agent responses on the server route
- react-native-reanimated 4.5.0 + gesture-handler - drawer gesture and animations
- react-native-safe-area-context, expo-status-bar, expo-symbols
- @expo/ui, expo-symbols, expo-glass-effect, expo-image ship with the starter
- any additional libraries are allowed (e.g. expo-haptics, react-native-keyboard-controller):
  pick whatever best clears the native-feel bar and note the choice in the final summary

## Commands

- install: `bun install` (starter ships bun.lock)
- add deps: `bunx expo install expo-sqlite` / `bun add @openai/agents`
- dev (client + api routes): `bunx expo start`
- native run on simulator: `bunx expo run:ios` (iPhone Pro class)
- lint: `bun run lint`
- typecheck: `bunx tsc --noEmit`

## Project structure

starter layout (routes live under `src/app`, not `app/`):

```
src/app/_layout.tsx          -> root layout (providers: safe area, db, theme)
src/app/index.tsx            -> chat screen (active conversation driven by state/param)
src/app/chat+api.ts          -> POST api route, streams the assistant reply
src/components/chat/         -> message-list, message-bubble, composer, empty-state, error-row
src/components/drawer/       -> sidebar drawer, conversation-row, search-field, edge-swipe gesture
src/components/model-picker/ -> header model button + native picker menu
src/lib/db.ts                -> expo-sqlite schema, migrations, queries
src/hooks/use-chat.ts        -> streaming, cancel, send, error/retry
src/hooks/use-conversations.ts -> list, create, rename, delete, search
src/constants/theme.ts       -> chat palette, light + dark
```

## Data model (expo-sqlite)

```sql
create table conversations (
  id text primary key,
  title text not null,
  model text not null default 'gpt-5.6-luna',
  created_at integer not null,
  updated_at integer not null
);

create table messages (
  id text primary key,
  conversation_id text not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at integer not null
);
```

- title = first user message truncated to ~40 chars (no llm title generation)
- a conversation row is created on first message send, not on "new chat"
- a stopped stream persists the partial assistant reply

## Code style

follow the starter's conventions: kebab-case filenames, functional components, typed
props, themed via `use-theme.ts` / `theme.ts`, lowercase comments.

```tsx
// src/components/chat/message-bubble.tsx
type MessageBubbleProps = {
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
};

export function MessageBubble({ role, text, streaming }: MessageBubbleProps) {
  const theme = useTheme();
  // ...
}
```

## Backend contract (fixed - do not deviate)

- `src/app/chat+api.ts`, POST, body = `{ messages, model }` (full history + requested model)
- server validates `model` against the allowlist `['gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra']`;
  anything else returns 400. never pass an unvalidated model string through.
- response = streamed plain text (the assistant reply only)
- generated with `@openai/agents`, streaming, agent name `Nova`, instructions verbatim:
  "You are Nova, a warm, sharp, and curious chat companion. Keep replies conversational
  and concise: one to three short paragraphs. Use plain text only, no markdown, no
  lists, no code blocks. Ask a light follow-up question when it feels natural."
- `OPENAI_API_KEY` from env only; never in client code, never logged
- `app.json`: `"web": { "output": "server" }` (starter ships `"static"`)
- client fetches relative `/chat`; abort via AbortController wired to the stop button
- no server database, no auth, no additional endpoints (persistence is client-side sqlite)

## Functional scope (build exactly this, nothing more)

1. chat screen: user/assistant messages visually distinct, newest at bottom,
   token-by-token streaming render, plain text only (no markdown)
2. composer pinned above keyboard: multiline input, send disabled when empty, stop
   button replaces send while generating, stop actually cancels the request and keeps
   the partial reply. sending is disabled while a reply is generating (no queueing a
   second message). the composer clears on send and does not restore its text on error.
3. sidebar drawer, chatgpt-style: slides in from the left via a header button and an
   interactive edge swipe (tracks the finger, dims the chat behind). custom
   reanimated + gesture-handler implementation, not a stock navigator drawer.
4. drawer contents: conversation list newest-first, search field filtering by title and
   message content, new chat button
5. conversation management: rename and delete via long-press context menu
   (swipe-to-delete additionally acceptable); titles auto-set from the first user
   message, truncated to ~40 chars
6. model picker: chat header shows the active conversation's model; tapping opens a
   picker with exactly `gpt-5.6-luna` (default), `gpt-5.6-sol`, `gpt-5.6-terra`. choice
   is stored per conversation and sent with every request.
7. persistence: conversations, messages, and per-conversation model survive relaunch
   (expo-sqlite)
8. launch behavior: app opens into a fresh empty conversation (empty state); history is
   reached through the drawer; unsent "new chats" are never saved
9. loading state (send -> first token) and inline error state with retry. if a stream
   dies mid-reply, the partial text stays in place with the error row beneath it;
   retry re-sends the failed turn.
10. no settings screen, no onboarding, no auth, no markdown, no attachments, no
    message actions (copy/regenerate/edit)

## Visual identity

chatgpt-like: native ios look, minimalistic, professional. choose your own app name and
palette, but no loud branding - restraint is the brand. use native components wherever
possible (@expo/ui, expo-symbols for sf symbols, native context menus and alerts) over
custom re-implementations; go custom only where the native option can't clear the bar
(e.g. the drawer).

## "Feels native" bar

- composer moves with the keyboard perfectly; interactive keyboard dismissal works
- scroll stays pinned to bottom while streaming, never fights manual scroll-up
- drawer edge-swipe is interactive and 60fps; open/close never jank
- safe areas respected everywhere; light and dark mode follow the system live
- subtle haptic on send, correct status bar style, no layout flashes on launch

## Testing strategy

no unit-test infra in the starter; the bar is behavioral. verification is manual on the
iOS simulator with evidence (screenshots/logs), against these core scenarios:

1. "hey nova, introduce yourself" - basic streaming
2. long-reply prompt - scroll anchoring, manual scroll-up mid-stream, stop button
3. airplane mode - inline error + retry
4. create a second conversation, rename it, search for it, jump between the two from
   the drawer, delete one
5. switch model in the header, kill the app, relaunch - history, titles, and
   per-conversation model all persist

plus: light/dark screenshots, keyboard show/hide/interactive-dismiss, fresh-launch
empty state, clean console at startup. lint + typecheck pass before every commit.

tooling and evidence:

- run on the iOS simulator (iPhone Pro class) with `bunx expo run:ios`
- use Argent MCP to drive and inspect the running app; verify every checkpoint with it
  before moving on, and re-verify after fixing anything that looked or behaved wrong
- save evidence screenshots to `verification/` at the repo root, named
  `NN-<scenario>-<light|dark>.png`; reference them in the final summary
- commit as you go: after every completed task and checkpoint, conventional prefixes
  (feat, fix, chore), lowercase, one-liner describing what was implemented

## Boundaries

- always: verify against expo sdk 57 docs (https://docs.expo.dev/versions/v57.0.0/) and
  current @openai/agents docs before using an api; commit after each working increment;
  run lint + typecheck before commits; validate the model param server-side
- judgment calls: you are autonomous - there is no one to ask. any libraries you judge
  necessary are allowed. make the call, keep it consistent with this spec, and record
  every judgment call in the final summary.
- never: api key in client code or logs; features beyond this spec; changing the pinned
  expo sdk version; markdown rendering; server-side persistence; extra endpoints

## Success criteria (definition of done)

- [ ] app builds and launches with no errors or warnings in the console at startup
- [ ] sending a message returns a streamed reply from the real backend route, rendered incrementally
- [ ] stop cancels generation mid-stream, keeps the partial reply, ui recovers cleanly
- [ ] scroll anchoring holds while a long reply streams; manual scroll-up mid-stream is not hijacked
- [ ] keyboard show, hide, and interactive dismiss keep the composer attached with no gaps or jumps
- [ ] drawer opens via header button and interactive edge swipe with no jank
- [ ] two+ conversations: jumping between them from the drawer restores each history correctly
- [ ] rename, delete, and search verified in the drawer
- [ ] model switched in the header; each conversation keeps its own choice; server rejects invalid models
- [ ] kill and relaunch: conversations, titles, messages, and model choices all persist
- [ ] light and dark mode verified with screenshots
- [ ] error state verified (kill the network or the key; inline error + retry)
- [ ] empty state verified on fresh launch
- [ ] final summary: what was built, judgment calls, paths to verification screenshots

## Runtime notes

1. the three model ids were verified live against the api on jul 16; still curl the
   route with all three before building the picker, and if one is not live, note it in
   the final summary and proceed with the working ones
2. keyboard handling: try the native approach first; if interactive dismiss can't clear
   the bar, add react-native-keyboard-controller
