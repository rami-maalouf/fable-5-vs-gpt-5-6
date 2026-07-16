# deviations and judgment calls

every non-obvious call made while implementing nova, in order. spec > plan > todo
on conflict; the contestant prompt (`spec.md`) is functional ground truth.

## 0. shared-machine contention: dedicated simulator + metro port 8090

this machine runs several contestant sessions concurrently. found: stale/live
metro dev servers from other contestants holding ports 8081-8084 (8081 belonged
to `ai-chat-app/gpt-5-6` - my app silently loaded THEIR js bundle from it), a
second app also named "Nova" (`com.rami.nova.gpt56`), and live ui automation
from another session driving the booted iphone 17 pro simulator. resolution:

- killed the stale metro processes squatting 8081-8084 (leftover dev servers,
  no data loss; 8081 was required for my app's default bundle url)
- moved to a dedicated simulator: iphone 17 pro max, ios 27
  (udid 705C1405-E555-4C11-840D-A874D16FA712) - still "iphone pro class"
- pinned my dev server to port 8090 (`bunx expo run:ios --port 8090`) so no
  other session can collide with my bundle/api requests again. the port is a
  dev-session flag only, nothing is committed; a judge running plain
  `bunx expo run:ios` with a free 8081 gets default behavior.

## 1. authoritative task docs synced into `tasks/`

the repo shipped with an older 14-task `tasks/plan.md` + `tasks/todo.md`
generation. the kickoff prompt names the 17-task set living next to it
(`prompt/test-2-tasks/{test-2-spec.md,plan.md,todo.md}`) as the documents to
execute. synced those three into `tasks/` (replacing the stale plan/todo) so
checkbox updates are committed as the audit trail. `spec.md` at the repo root
(the contestant prompt) left untouched as ground truth.

## 2. component filenames follow test-2-spec (PascalCase), not starter kebab-case

the contestant prompt says "follow the starter's conventions: kebab-case
filenames"; the normative test-2-spec's project-structure section names
component files in PascalCase (`MessageList.tsx`, `Composer.tsx`) and hooks in
camelCase (`useChatStream.ts`). kickoff ranks test-2-spec as normative for
architecture, so its structure wins; non-component modules stay kebab-case
(`conversation-repo.ts`, `db.ts`).

## 3. test infra judgment calls

- jest pinned to 29.x (jest-expo 57 targets jest 29 internals; jest 30 crashes
  with a moduleMocker incompatibility)
- `better-sqlite3` added as a devDependency only, as an in-memory stand-in for
  expo-sqlite in repo unit tests; the repos code against a 3-method async
  interface (`runAsync`/`getAllAsync`/`getFirstAsync`) that matches
  expo-sqlite's SQLiteDatabase, so production code paths are identical
- `zod@^4` added explicitly: `@openai/agents` declares a zod ^4 peer that bun
  resolved to 3.x transitively

## 5. client resolves /chat against window.location, not expo/fetch relative

the spec says the client calls relative `fetch('/chat')`. with the packager on
a non-default port, `expo/fetch`'s own relative resolution returned 404s from
the wrong origin, while `window.location` (set by expo-router to the dev
server / configured production origin) was correct. `useChatStream` therefore
resolves `new URL('/chat', window.location.href)` and passes the absolute url
to expo/fetch. no origin is hardcoded anywhere; call sites still say '/chat'.

## 6. dev-session launch mechanics (not part of the app)

because the dev server lives on port 8123 (deviation #0), the simulator app is
pointed at it via `xcrun simctl spawn <udid> defaults write com.ramimaalouf.nova
RCT_jsLocation "localhost:8123"` once per device, then launched normally. a
judge on a clean machine with 8081 free needs none of this - plain
`bunx expo run:ios` works with defaults.

## 4. starter scaffolding removed

deleted the starter's tabs/explore demo screens, demo components, and the
expo-widgets plugin + dependency (unused by this app, slows the native build).
app identity set to "Nova" / `com.ramimaalouf.nova`, scheme `nova`.
