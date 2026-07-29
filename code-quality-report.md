# code quality scoring report

framework: `code-quality-scoring` (bobmatnyc/claude-mpm-skills, CAST Highlight-derived).
each repo scored by an independent subagent that read every source file (node_modules,
lockfiles, and generated files excluded). Health = avg(Resiliency, Agility, Elegance),
0-100. bands: green >75, orange ~53-75, red <53. debt = estimated effort-to-fix,
bottom-up violation count, +/-50% fidelity. run date: 2026-07-28.

## portfolio ranking

| rank | app / model | health | resiliency | agility | elegance | loc | debt (midpoint) |
|------|-------------|--------|------------|---------|----------|-----|-----------------|
| 1 | ai-calorie-tracker / fable-5 | 88 green | 91 | 90 | 84 | 3.7k | ~5h |
| 1 | swift-rewrite / fable-5 | 88 green | 90 | 89 | 85 | 10.7k | ~6h |
| 3 | swift-rewrite / gpt-5-6 | 86 green | 90 | 85 | 82 | 15.3k | ~12h |
| 4 | ai-chat-app / fable-5 | 85 green | 80 | 90 | 86 | 2.0k | ~4h |
| 5 | ai-calorie-tracker / gpt-5-5 | 79 green | 88 | 78 | 72 | 4.7k | ~12h |
| 5 | ai-calorie-tracker / gpt-5-6 | 79 green | 88 | 73 | 76 | 4.3k | ~10h |
| 7 | ai-chat-app / gpt-5-6 | 78 green | 84 | 78 | 72 | 3.5k | ~7h |
| 8 | ai-chat-app / gpt-5-5 | 77 green | 79 | 84 | 68 | 3.6k | ~10h |
| 9 | swift-rewrite / gpt-5-5 | 76 green (borderline; elegance is orange) | 78 | 81 | 68 | 14.0k | ~24h |

## per-model averages

| model | avg health | total debt (midpoints) | total loc | debt density |
|-------|-----------|------------------------|-----------|--------------|
| fable-5 | 87.0 | ~15h | 16.4k | ~0.9 h/kLOC |
| gpt-5-6 | 81.0 | ~29h | 23.1k | ~1.3 h/kLOC |
| gpt-5-5 | 77.3 | ~46h | 22.3k | ~2.1 h/kLOC |

## cross-model patterns

- fable-5 wins every app, and by the widest margin on elegance. it also writes
  noticeably less code for the same spec (chat app: 2.0k loc vs 3.6k/3.5k) and ships
  zero dead starter code.
- both gpt variants repeatedly ship leftover expo starter-template code as dead weight:
  ~730 loc in ai-chat-app/gpt-5-5, ~594 loc in ai-chat-app/gpt-5-6 (~17-20% of src),
  plus unused starter components, "Expo Starter" branding, and two competing theme
  systems in 5 of their 6 repos. this is the single biggest recurring quality drag.
- gpt repos systematically swallow errors: bare `catch {}` blocks with no logging in
  both chat apps and both sleep apps. failures surface as generic ui states that are
  undiagnosable in production.
- all three models scored high on resiliency in the calorie tracker and swift rewrite
  (88-91): requestid-guarded state machines, abortcontrollers, dual-boundary payload
  validation. defensive coding is a strength across the board.
- gpt-5-6 is a clear step up from gpt-5-5, mostly via less duplication and fewer dead
  ends (biggest gap: swift-rewrite, 86 vs 76).
- the large swift-rewrite ports expose duplication habits in every model: copy-pasted
  chart scaffolding, per-file micro-helpers (formatClock x4, sortedByDate x6), and
  re-implemented domain constants that can drift (both gpt sleep apps re-hardcode
  alignment weights with a 0.03 vs 0.01 threshold divergence).

---

## ai-calorie-tracker / fable-5 - health 88 (green)

- language: TypeScript / React Native (Expo Router, API routes). loc 3,686 (+3,130 test loc).
- resiliency 91: pure reducer state machine with request-id staleness guards
  (src/domain/scan-machine.ts); analyzePhoto never throws, returns typed outcomes incl.
  aborted; api route validates both boundaries; camera denied/unavailable fallbacks.
  gap: no timeout on the /scan fetch (src/services/analyze-photo.ts:34) - a hung request
  leaves "Analyzing" until manual discard.
- agility 90: why-comments everywhere, clean domain/services/state/components layering,
  shared client-server contract module, 17 test files, DEVIATIONS.md.
- elegance 84: minor duplication - close/camera svg glyphs x3, "preparing pill" overlay
  x2, entrance animation repeated in 4 components; dead `cancel_acquisition` event
  (src/domain/scan-machine.ts:40,84).
- debt: 3-8h, midpoint ~5h.
- priorities: 1) client-side timeout on the /scan fetch (only production-incident risk).
  2) extract shared ui primitives + delete dead event (~2-4h).

## ai-calorie-tracker / gpt-5-5 - health 79 (green)

- language: TypeScript / React Native (Expo SDK 57, @openai/agents). loc 4,677.
- resiliency 88: discriminated-union state machine with requestid guards, abort on
  unmount, strict validation (base64 pattern, 8m size cap). gaps: Date.now()-only request
  ids (app/scan.tsx:446), api route catch swallows all detail with no logging
  (app/scan+api.ts:62), no meal persistence.
- agility 78: clean layering + ~2,740 test loc, but two parallel theme systems
  (src/theme/tokens.ts vs src/constants/theme.ts) and leftover starter content
  ("Expo Starter" branding, explore tab) obscure the real app.
- elegance 72: near-identical parsers with divergent max-value rules
  (scan-contract.ts:59-115 vs nutrition.ts:107-136); widget duplicates view logic with
  hard-coded hexes; card/button styles re-declared in 4 components; dead HintRow +
  starter explore screen.
- debt: 8-16h, midpoint ~12h.
- priorities: 1) delete starter leftovers, consolidate onto one token system (~4-6h).
  2) unify the two nutrition parsers, extract shared scan ui primitives, add api error
  logging (~4-6h).

## ai-calorie-tracker / gpt-5-6 - health 79 (green)

- language: TypeScript / React Native (Expo SDK 57 + iOS widget). loc 4,262 (+2,644 test loc).
- resiliency 88: pure requestid-guarded state machine, abortcontroller + mounted refs +
  re-entry locks, shared zod contract validated on both server and client. gaps: no
  timeout on the model call (app/scan+api.ts:46); meals memory-only, no day rollover.
- agility 73: good layering and 2.6k test loc, but two parallel theme systems,
  inconsistent file naming, AppTabs renders a Stack not tabs, "Expo Starter" leftovers.
- elegance 76: dead starter code (~400 loc: animated-icon x2, hint-row, explore
  tutorial); widget re-implements its own tested model fn with a hard-coded 2000 goal
  (widgets/RemainingCaloriesWidget.tsx:59-60 vs 145-184); ref+reducer double-tracking and
  a no-op 'discard-result' action in day-context.
- debt: 7-14h, midpoint ~10h.
- priorities: 1) delete starter leftovers, collapse onto nourishThemes tokens.
  2) abortsignal timeout on the model call; render widget from its model fn with the goal
  sourced from DAILY_GOALS.

## ai-chat-app / fable-5 - health 85 (green)

- language: TypeScript / React Native (Zustand, expo-sqlite). loc 1,957 (+809 test loc).
- resiliency 80: api route validates json/model/message shape; stream core distinguishes
  complete/stopped/error and preserves partial text on abort; db writes never block the
  conversation. gaps: no try/catch around run(agent) in the route (src/app/chat+api.ts:46);
  reset() during an active stream doesn't abort in-flight (chat-store.ts:71-77); two
  fire-and-forget iifes without catch.
- agility 90: framework-free core split from react bindings, largest file 171 lines,
  intent-revealing comments, 9-file test suite. nit: Conversation.model typed
  `ModelId | string`.
- elegance 86: shared executeTurn removes send/retry duplication, 40ms token batching,
  proper sql index. minor: dead updateMessage (test-only), drawer search over-fetches all
  message bodies.
- debt: 2-6h, midpoint ~4h.
- priorities: 1) try/catch around the agent run returning structured json error (~0.5h).
  2) make reset/loadConversation abort in-flight streams (~1-2h).

## ai-chat-app / gpt-5-5 - health 77 (green)

- language: TypeScript / React Native (Expo SDK 57, Zustand, SQLite). loc 3,620 (+2,144 test loc).
- resiliency 79: type-guarded api route, check constraints + fk cascade in sqlite,
  abort handling, serialized write queue. gaps: uncaught promise chains (index.tsx:164,
  drawer search); 3 dependent writes without a transaction (chat-persistence.ts:53-87);
  production url falls back to a bare relative path that breaks native release builds
  (useChatStream.ts:47-51); Alert.prompt rename is ios-only.
- agility 84: clean layering, SqlDatabase port + adapter, 18-file test suite,
  DEVIATIONS.md. dragged down by ~730 loc of starter leftovers and two theme systems.
- elegance 68: ~20% of src is dead starter code (themed-text/view, animated-icon x2,
  app-tabs x2, hint-row, web-badge, external-link, collapsible, use-theme,
  constants/theme); duplicated sql search in domain/search.ts; useChatStream keeps
  unread state and re-renders per flush.
- debt: 6-14h, midpoint ~10h.
- priorities: 1) fix production/native chat url resolution + wrap turn-start writes in a
  transaction (the two real-usage breakers). 2) delete the dead starter code and add
  .catch + user-visible errors on the load/search chains.

## ai-chat-app / gpt-5-6 - health 78 (green)

- language: TypeScript / React Native (Expo SDK 57, expo-sqlite). loc 3,487 (+427 test loc).
- resiliency 84: zod-validated api route, parameterized sql with like-escape helper,
  versioned migration with downgrade guard, session/request version counters with
  partial-content persistence on abort. gap: every catch block is bare - failures are
  never logged; no rate limiting.
- agility 78: consistent naming, pure logic extracted into testable libs, 24 unit tests.
  but the hardest logic (deferred-persistence prepare closures, timestamp-1 re-insertion,
  session versioning in use-chat.ts:80-258) has zero comments, and ~594 loc of starter
  leftovers create two theme systems.
- elegance 72: ~17% of src is dead template code; minor duplication (withTiming callback,
  error ui). live code lean: memoized rows, stream text batcher, debounced search,
  indexed sql.
- debt: 4-10h, midpoint ~7h.
- priorities: 1) delete the ~594 loc of dead template code, single theme source.
  2) add error logging in the bare catches + comment the use-chat retry machinery.

## swift-rewrite / fable-5 - health 88 (green)

- language: TypeScript / React Native (Skia, Zustand, expo-sqlite) + small swift parity
  harness. loc 10,717 incl. tests.
- resiliency 90: dst-safe two-pass timezone math, hour-24 intl quirk normalized, guarded
  divisions, per-key settings validators, platform-gated ios-only native calls. verified
  by 5 golden-fixture parity suites against the verbatim swift analyzer + ~1,800 test
  lines. nits: Math.random uuids, unwrapped sqlite calls.
- agility 89: every file has a "ports: <swift file>" traceability comment, textbook
  layering, strict ts, DEVIATIONS.md for every intentional divergence. few 350+ line
  screens.
- elegance 85: o(n) rolling-sum moving average, cached formatters, shared chart utils.
  main waste: AlignmentCard re-derives the analyzer's weighted geometric mean with a
  divergent threshold (0.03 vs 0.01); scrub logic x3; deviceTimeZone x4; dead
  victory-native dependency.
- debt: 4-9h, midpoint ~6h.
- priorities: 1) reuse useScrub + export one composite-score fn from the analyzer (~2-3h).
  2) hygiene sweep: shared micro-helpers, expo-crypto randomUUID, drop victory-native (~2-3h).

## swift-rewrite / gpt-5-5 - health 76 (green, borderline; elegance orange)

- language: TypeScript / React Native (Skia, victory-native). loc 13,963 incl. tests/spikes.
- resiliency 78: db-level partial unique index enforcing one active session, per-key
  settings fallbacks, golden parity fixtures (timezone traveler, midnight shift worker).
  gaps: core write path has no catch (SleepToggleCard.tsx:108-143 - failed session
  start/end shows nothing), uncaught init/delete paths, permanent 1s sqlite polling loop
  (sleep-appearance.tsx:108-127), `.catch(() => undefined)` silencers on syncs.
- agility 81: tested `*-model.ts` companion per screen, ~30 test files, swift provenance
  comments. dragged by sortedByDate defined in 6 files, 704-line DashboardScreen, unused
  parallel theme system, and stale scaffolding copy in user-facing strings ("arrives in
  task 18").
- elegance 68 (orange): ~350+ loc dead code (alt theme system, placeholder screen, unused
  buttons, template leftovers, unused zustand dep); heavy duplication (grayscale suite
  copied verbatim from a spike, date/format helpers x2-6); production service imports
  from spikes/ (live-activity-spike.ts:10-14); per-second poll never stops.
- debt: 16-32h, midpoint ~24h.
- priorities: 1) harden the session write path (catch + user feedback on toggle/delete/
  init) and replace the 1s poll with event-driven refresh (~4-8h). 2) delete dead code
  and consolidate duplicated helpers (~8-12h).

## swift-rewrite / gpt-5-6 - health 86 (green)

- language: TypeScript / React Native (Skia, victory-native). loc 15,304 (11.4k production,
  3.1k tests, 0.8k quarantined spikes).
- resiliency 90: dst-safe zone math with explicit errors for invalid iana zones and
  nonexistent wall-clock times, race-safe db unique index, typed repo errors, rollback +
  toasts on every mutation, corrupt-json settings fallback, 5-persona golden-fixture
  parity. gaps: zero logging (bare catches); one db error rendered as an empty dashboard
  (app/(tabs)/index.tsx:65).
- agility 85: clean layering, dependency injection everywhere (clients, persistence,
  now(), random()), swift provenance headers. docked for near-zero comments on the
  trickiest algorithms and repeated micro-helpers (formatClock x4, normalizeMinutes x5).
- elegance 82: o(n) rolling sums, formatter caches, memoized chart models. docked for
  ~150-200 loc of copy-pasted chart scaffolding (AlignmentCard/MovingAverageCard vs
  MetricsChartCard), re-hardcoded alignment weights with a drifted 0.03 vs 0.01 threshold,
  ~280 loc dead components, 4 unused deps, and 5 dev spike routes unguarded by __DEV__ in
  production navigation.
- debt: 9-15h, midpoint ~12h.
- priorities: 1) consolidate chart scaffolding + consume METRIC_SCORING from the domain
  engine (~4-5h). 2) housekeeping: dead code, unused deps, __DEV__-gate spikes, merge
  helpers, minimal logging (~5-7h).
