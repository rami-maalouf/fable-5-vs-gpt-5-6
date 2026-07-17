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

## checkpoint 6: remaining screens (tasks 20-24) - PASS (jul 16)

every screen walkable side by side vs the reference set (self-verified,
evidence under evidence/task-20..24):

- settings vs IMG_4811: large title, support row, sleep goal card (indigo
  bedtime / orange wake native compact time pickers + "Goal: 9 hr" pill), app
  appearance pickers (display mode System/Sunset/Night Sky; theme color
  twilight/amethyst - live switch verified, background/tints update in
  place), wind-down toggle + description, wind-down routine timeline screen
  with times derived from the bedtime, live activity toggle, community
  links. NFC & QR / apple health / data sections intentionally absent (spec
  scope; DEVIATIONS.md).
- onboarding (4-step flow per the spec decision): welcome with glowing moon +
  4 trust cards + staggered entrances, schedule step with the 260pt circular
  picker writing the goal live, notification step with preview card + real
  permission prompt (granted -> green "Notifications Enabled" like the
  original), finish writes is_onboarded and lands on the dashboard. fresh
  install gate verified live; dev restart row in settings.
- metrics vs IMG_4802-4807: overview 6-tile + highlights 4-tile grids,
  duration momentum (target-colored bars + 7-night catmullRom line + dashed
  target), trend/median chips, trends analysis table (3/7/14/30/90 rows with
  change chips + sparklines), regularity 6-tile grid, latest chips, rolling
  consistency (teal area/line + 80 rule + scrub bubble), rolling 14-night
  components (indigo/orange/green-dash lw2.8 + all/bedtime/wake/accuracy
  filter + legend), cumulative debt (accent line/area + zero rule), weekday
  averages (purple weekends + per-day labels), histogram with % annotations,
  range-start/total-range footer tiles, empty state, 30D/90D/1Y/All ranges.
- timeline sheet (detent 0.82 + grabber): horizontal bed->wake bars with
  indigo/orange endpoints, dashed target rules, target pills, hour axis on
  the 18:00-offset scale, per-night rows with date labels.

verification: 201 tests green, tsc clean, lint clean.

code-quality review (tasks 20-24): typed the scrub gesture prop (no any);
guarded ios-only ActionSheet pickers with an android cycle fallback (boot
scope); reactive settings hook (useSettings) replaced direct kv reads across
dashboard/editor so goal edits propagate live. known debt: "latest" chips and
rolling charts legitimately show "-"/empty until 14 nights exist (mirrors the
original's windowing).

## checkpoint 7: polish (tasks 25-26) - PASS (jul 16)

- animation/haptic sweep vs the spec map: fadeInSlide (spring 0.4/0.6, y30)
  on dashboard sections + onboarding steps; glass press scale 0.96
  spring(0.3); moon breathing 3.0s; starfield twinkle/shooting params per
  source; picker haptics light on grab + each 5-min snap, medium on release;
  rounded buttons light; theme pickers medium; streak indicator renders as
  plain text (animation disabled like the original's transaction). the
  picker's "appear pulse" is dead code in the swift source and is omitted
  (DEVIATIONS.md). light-mode log rows fixed (previously logged debt).
- fps: assessed qualitatively on the simulator (smooth starfield + scrub);
  no instrumented overlay - noted honestly in DEVIATIONS.md.
- wind-down notification verified on device: daily
  UNCalendarNotificationTrigger at 19:00 for the 22:00 bedtime (3h before,
  minutes preserved), rescheduled on launch/bedtime change, toggle off
  cancels (0 scheduled) - evidence/task-26/. copy bank: title
  "Wind Down Time 🌙" + 10 verbatim messages, unit-tested incl. the
  past-midnight wrap.
- verification: 204 tests green, tsc clean, lint clean.

code-quality review (tasks 25-26): notification service kept behind a pure
time-math helper (testable); dev-only probe row added for scheduled
notifications. no quality debt carried forward.

## checkpoint 8: live activity (tasks 27-28) - PASS with island unverified (jul 17)

the plan calls for physical-device verification of dynamic island behavior; this
run is simulator-only, so per the kickoff the gate goes as far as the simulator
allows and the island is reported honestly as unverified.

verified on the iPhone 17e simulator (iOS 27) lock screen:

- session start (in-app or via the lock-screen Start Sleep button) presents the
  activity: moon + "Rejuvenating...", elapsed timer, progress bar toward the
  sleep goal, remaining countdown + "left", Wake Up button
  (evidence/task-28/start-sleep-button-started-session.png).
- wake up button on the lock screen ends the session WITHOUT opening the app:
  session row lands in the db with end_time set, app foregrounds to
  "Go to Sleep", and - because bedtime was inside the 3h window at the time -
  the wind-down countdown took the sleep activity's place
  (evidence/task-27/*.png).
- app kill + relaunch: reconcileLiveActivity() reuses the surviving activity
  (timers continuous, no duplicate) - verified pre-gate on the same device.
- wind-down superpower: with bedtime inside the 3h window the lock screen shows
  moon.zzz + "Winding down..." + live countdown to bedtime + Start Sleep button
  (evidence/task-28/winddown-countdown-lockscreen.png); tapping Start Sleep
  starts a real session from the lock screen and the app opens in the sleeping
  (grayscale) state (evidence/task-28/app-sleeping-after-start-sleep-button.png).
- sub-5-minute wake from the button path still shows the joke alert and hides
  the session (evidence/task-28/wake-in-app-joke-alert-color-restored.png).
- restoring bedtime outside the window clears the countdown on next foreground
  (evidence/task-28/lockscreen-clean-after-bedtime-restored.png).

UNVERIFIED: dynamic island compact/minimal/expanded rendering and the expanded
island wake-up button. implemented in widgets/sleep-activity.tsx but only island
hardware renders them; no physical device was available to this run.

verification: 204 tests green, tsc clean, lint clean.

code-quality review (tasks 27-28): stale wind-down countdown found during the
gate (expired bedtime kept showing 0:00 after midnight) and fixed - the stored
activity id now encodes its bedtime so changed bedtimes replace the countdown,
and out-of-window foregrounds clear it; 'widget' function keeps every constant
inline (compiler captures only the function body). no quality debt carried
forward.

## checkpoint 9 (final): android boot (task 29) + spec success criteria (jul 17)

task 29 verified on a dedicated emulator (AVD fable5_api_36, android 36,
serial emulator-5556; created for this run to avoid contending with a parallel
run's emulator-5554):

- `bunx expo run:android` builds and installs (openjdk 21 via JAVA_HOME; the
  machine had no default java runtime).
- boot bug found and fixed: android has no "compact" inline date/time picker -
  every mounted picker opened its modal dialog immediately (all of them at
  launch, since native tabs mount tabs eagerly). settings + log editor now use
  a platform-guarded InlineDateTimePicker: ios keeps the native compact
  control, android renders a value chip that opens the system dialog on demand
  (evidence/task-29/android-settings-time-dialog-on-demand.png).
- live activity guarded ios-only: the widget module (whose createLiveActivity
  requires the ios native factory) is required lazily behind Platform.OS, and
  every sync effect no-ops off ios. android boots with no crash.
- acceptance walked end to end: onboarding (welcome -> schedule with the skia
  circular picker -> notifications incl. the system POST_NOTIFICATIONS dialog
  -> Notifications Enabled) -> dashboard; all 4 tabs navigate; a session
  toggles on and off incl. the grayscale-while-asleep palette and the sub-5-min
  joke alert (evidence/task-29/*.png).
- honesty note: the first `expo run:android` auto-launched this app on the
  shared emulator-5554 and stole foreground from a parallel run before the
  dedicated AVD was created. nothing of theirs was modified; all verification
  ran on emulator-5556.
- ios regression check after the picker refactor: settings still renders the
  native compact pickers; dashboard normal; 204 tests, tsc, lint all clean.

spec success criteria (final):

- [x] port builds and runs on ios simulator + boots on android
- [x] priorities 1-7 done; 8 attempted (and passing its acceptance)
- [x] golden-fixture metric tests pass against the real swift engine (50/50)
- [x] side-by-side visual review per screen - self-verified against the
      reference screenshots per the kickoff's autonomous-gate rule
      (evidence/task-17..24, checkpoint-05)
- [~] live activity: lock-screen parity + both interactive buttons + wind-down
      state verified on the SIMULATOR; physical-device dynamic island remains
      UNVERIFIED (no device available) - reported, not claimed
- [x] all 3 themes verified live (twilight, amethyst, sunset via light mode)
- [x] timezone edges pass (midnight crossing, dst, travel fixtures)
- [x] DEVIATIONS.md complete
- [x] design tokens matched by the theme module (palette tests pin the spec hex
      tables)

code-quality review (task 29): picker fallback extracted as one shared
component instead of per-screen forks; live-activity platform guard placed at
the module boundary (single require site) rather than sprinkled through call
sites. no quality debt carried forward.
