# checkpoint log

self-verification gates from plan.md. each entry: gate, what was checked, evidence
paths, pass/fail, and the code-quality review outcome for the phase.

## checkpoint 1: foundation (tasks 1-5) - PASS (jul 16)

- `bunx expo run:ios` boots the shell on iPhone 17 Pro sim (iOS 26.5,
  udid B47A3DF3): 4 tabs navigate via native system tab bar with sf symbols
  (house.fill / chart.xyaxis.line / list.bullet.clipboard / gearshape.fill),
  tinted with the theme accent. evidence: evidence/task-01/*.png.
- `bun run test` green: 48 tests (session rules incl. dst/travel/midnight,
  sqlite repo round-trips, settings defaults, palette tokens vs spec table,
  provider switching). `bunx tsc --noEmit` clean. `bunx expo lint` clean.
- chrome side-by-side vs IMG_4796: gradient stops match (#0a1520 -> #0f2a3d),
  starfield density/twinkle present, glass card + glowing moon render, both
  night palettes verified live (evidence/task-05/chrome-twilight.png,
  chrome-amethyst.png). shooting star observed on device.
- note: port 8081 was held by a parallel run; metro runs on 8082 and the
  installed app is pointed at it via RCT_jsLocation user default.

code-quality review (tasks 1-5): removed unused shared value + empty style
(StarfieldView, GlassButton), moved test helper out of __tests__ so it is not
collected as a suite, pinned eslint 9 for eslint-config-expo compatibility.
no known quality debt carried forward.

## checkpoint 2: risk burn-down (tasks 6-8) - PASS (jul 16)

three decisions recorded in spikes.md, all verified live on simulator:

1. live activity superpower FEASIBLE AS SPECCED - lock-screen wake-up button
   fires a LiveActivityIntent that reaches js while backgrounded and ends the
   activity (evidence/task-06/). spec open question 1 closed.
2. charts: hand-rolled skia kit for all charts - week chart matches IMG_4796
   mark-for-mark incl. dual-axis collision hiding and selection popover
   (evidence/task-07/). victory-native rejected: no range bars. spec open
   question 2 closed.
3. grayscale: desaturated palette swap (rec.709) through ThemeProvider's
   `desaturated` prop; ios has no tree-wide saturate filter
   (evidence/task-08/).

verification: 61 tests green, tsc clean, lint clean.

code-quality review (tasks 6-8): spike harness removed from settings tab;
skia PathBuilder migration applied (deprecation warning gone); unused linePath
helper dropped; 'widget'-directive constant-capture pitfall documented in
spikes.md. INCIDENT logged: an early `git commit` swept files another parallel
agent had staged into the shared index (commit 3eaa554 contains
swift-rewrite/gpt-5-6 data-layer files not authored by this run). history was
not rewritten (later commits landed on top); prevention adopted: all commits
now use `git commit -- .` scoped to this app dir and never `-A`/`--amend`.

## checkpoint 3: core sleep flow (tasks 9-13) - PASS (jul 16)

track-a-night verified end to end on the simulator (iPhone 17e, iOS 27):

- circular picker: drag both knobs with 5-min snap + haptics, midnight-crossing
  arc, live 48pt duration + quality copy; ieee754 angle math at exact parity
  with the swift original incl. its Int() truncation quirk
  (evidence/task-09/). drag math unit-tested (14 tests).
- toggle: go to sleep -> wake persists a session; sub-5-minute wake shows the
  "Pause..." alert with a pluralized joke from the 7-message bank and the
  session is hidden from every list; exactly one active session; kill +
  relaunch restores the sleeping state (evidence/task-10/).
- grayscale-while-asleep: entire ui desaturates (gradient, buttons, tab tint,
  picker arc/knobs, chart fixed colors) and restores on wake
  (evidence/task-11/).
- logs list matches IMG_4809 (large title, + button, day / start->end /
  accent duration badge rows, hairline separators); swipe-to-delete removes
  from store (evidence/task-12/).
- editor matches IMG_4810 (cancel/inline title, wake-day pill, goal-match card
  with the -30pts/hr formula, 220pt picker, bedtime/wake cards, pinned save
  bar); create ("Manual Log") and edit paths persist tz-correctly; crossover
  logic unit-tested incl. dst and travel round-trips (evidence/task-13/).

verification: 94 tests green, tsc clean, lint clean.

code-quality review (tasks 9-13): moved the app sleep-store singleton out of
the factory module (kills a require() cycle + lint warning); replaced inline
import() types with top-level type imports on the dashboard; migrated
DateTimePicker to the non-deprecated onValueChange; fixed a
setState-during-render warning in the picker's drag handler. no quality debt
carried forward.

## checkpoint 4: metrics engine (tasks 14-16) - PASS (jul 16)

- fixture parity is proven against the REAL swift implementation, not
  hand-traced numbers: tests/parity-harness/ compiles the verbatim
  Utils/SleepMetricsAnalyzer.swift + Views/SleepDataModels.swift (with a
  minimal BlockedProfileSession stub) into a cli that emits every
  deterministic metric as json; the five fixture sets in tests/fixtures/
  (regular sleeper, shift worker, timezone traveler, sub-5-min noise + active
  session, gaps/streak breaks with canonical-night contention) were run
  through it (TZ=America/Denver) to produce the golden `-expected.json`
  files. jest replays the ts engine over the same sessions: 50/50 parity
  assertions green (records incl. dates/weekdays/offsets, all scalar metrics,
  moving-average/rolling-consistency/debt/alignment series, trends table,
  weekday averages, histogram buckets).
- every spec constant traced to a passing test: ±0.75h goal tolerance
  (inclusive boundary), -40 pts/hr consistency (Int() truncation), -30 pts/hr
  accuracy, 18:00 base hour, 0.35/0.30/0.20/0.15 alignment weights with the
  0.01 sub-threshold drop + renormalization, ema 0.8/0.2, 7-night moving
  window, 14-night rolling window, 3/7/14/30/90 trends, 8 histogram buckets.
- port bug found BY the fixtures and fixed: canonical nights must be grouped
  by the sleepDate instant (startOfDay in each session's end tz), not the
  wall-clock day string - two same-date nights in different timezones both
  survive in the original (timezone-traveler red-eye case).
- verification: 181 tests green, tsc clean, lint clean.

code-quality review (tasks 14-16): analyzer kept pure (no react/expo
imports); Int()-truncation semantics documented at each site; duplicate
stddev helper collapsed; harness + generator committed for regeneration
auditability. no quality debt carried forward.

## checkpoint 5: dashboard fidelity (tasks 17-19) - PASS (jul 16)

side-by-side against the reference set (self-verified per the kickoff's
autonomous-gate rule; evidence under evidence/task-17, task-19,
checkpoint-05):

- week mode vs IMG_4796: greeting + emoji (9 banks, tap to shuffle verified
  live), date line, segmented picker, 4 insight pills (full titles via
  font-scaling like minimumScaleFactor), week chart with dual axis + 3 dashed
  rules + gray catmullRom duration line + selection scrub, status card with
  flame streak pill, go-to-sleep button + "Tap to start" caption.
- 7-night avg vs IMG_4797: vs-7d/vs-target/range pills, above/below-target
  area segments split at crossings (AreaMark yStart=target semantics), dashed
  target rule, selection footer with date / avg / vs-target.
- score vs IMG_4798: daily/trend/main-drag/flame pills, green-orange bars at
  the 70 threshold, ema trend line, dashed 70 rule, y axis [0,25,50,70,100],
  component bars duration/timing/phase/consistency with ignored state.
- core vs IMG_4799: duration + consistency only, composite reweighted (0.35 +
  0.15), separate streak (best 2d).
- all three themes captured on the dashboard: twilight, amethyst, sunset
  (evidence/checkpoint-05/) - sunset revealed a dark pill background, fixed to
  theme-aware before the gate closed.
- analytics guide sheet (0.6/large detents + grabber) matches the original's
  content and layout.

verification: 201 tests green, tsc clean, lint clean.

code-quality review (tasks 17-19): moving-average domain + area-splitting
logic ported as exported pure functions (testable); shared date-scale helpers
extracted for all date-series charts; insight pills theme-aware; jest
transform allowlist extended for expo-router's esm dependency. known minor
debt: log rows use fixed dark ios list colors (correct for the reference
dark theme; light-mode pass scheduled with task 25 polish).
