# Checkpoints

Each checkpoint records the gate, checks performed, evidence paths, result, and code-quality review outcome.

## Checkpoint 1: themed shell

- date: 2026-07-16
- gate: tasks 1-5 complete
- automated checks: `bun run test` passed 22 tests; `bun run typecheck` passed;
  `bun run lint` passed; `git diff --check` passed
- simulator: iPhone 17, iOS 27, dev client bundle
  `studio.orbitlabs.twilight.expo`
- interaction checks: all four native tabs remained accessible and navigable; live
  palette controls switched and persisted Twilight and Amethyst; Home rendered the
  animated moon, starfield, shooting star, and active Skia aurora card
- Swift reference:
  `prompt/test-3-tasks/twilight-swift-ui-screenshots/IMG_4796.PNG`
- Expo evidence:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-U6xc3G/media/969165000-1784197727969.png`
- visual result: gradient direction and stops, sparse star density, translucent
  rounded cards, text hierarchy, and accent-tinted native tab selection match the
  Swift chrome. The pixel diff measured 36.22% because the reference contains the
  full dashboard while this checkpoint intentionally retains placeholder content.
- review outcome: no correctness, accessibility, security, or maintainability
  blockers. The review removed duplicate moon accessibility nodes and replaced the
  initial aurora opacity approximation with a real Skia blur plus alpha-threshold
  runtime filter. A second blur and translucent composite preserve readable dark
  glass edges.

## Checkpoint 2: risk burn-down

- date: 2026-07-16
- gate: tasks 6-8 complete
- automated checks: `bun run test` passed 30 tests; `bun run typecheck` passed;
  `bun run lint` passed
- simulator: iPhone 17, iOS 27, dev client bundle
  `studio.orbitlabs.twilight.expo`
- Live Activity decision: use elapsed time, wind-down state, rich island content,
  and a deep link. Do not let the activity mutate the SQLite session directly
  because Expo's intent event has no durable handoff when the app process is gone.
- chart decision: use Victory Native for bounds, scales, Catmull-Rom paths, and
  press state, with custom Skia floating bars, rules, and selection marks.
- grayscale decision: generate desaturated Twilight and Amethyst themes and apply
  a shared Skia luminance matrix. React Native's native saturation filter remained
  colored on the stable Expo iOS configuration.
- evidence:
  - `spikes/live-activity/README.md`
  - `spikes/chart-approach/evidence/week-chart-spike-selected.png`
  - `spikes/grayscale-while-asleep/evidence/palette-twilight.png`
  - `spikes/grayscale-while-asleep/evidence/palette-amethyst.png`
  - `spikes/grayscale-while-asleep/evidence/native-filter-amethyst.png`
- review outcome: all three experiments remain quarantined. The chart scrub is
  immediate and no longer conflicts with stack navigation. Both night grayscale
  variants preserve readable text and pair semantic colors with labels. The only
  device limitation was SpringBoard's inaccessible first-use Live Activity consent
  sheet; the framework source still establishes that its event is process-local.

## Checkpoint 3: core sleep flow

- date: 2026-07-16
- gate: tasks 9-13 complete
- automated checks: circular-picker math, persistence, invalid-session rules,
  editor crossover behavior, and log models pass in the full test suite
- simulator: iPhone 17, iOS 27, dev client bundle
  `studio.orbitlabs.twilight.expo`
- interaction checks:
  - created, edited, and deleted a manual sleep log
  - started and ended a tracked session
  - force-quit and relaunched with an active session preserved
  - ended a sub-five-minute session and verified the exact joke copy
    `That 9 seconds sleep was a trailer, not the feature.`
  - verified the invalid short session did not appear in Sleep Logs
- evidence:
  - `evidence/checkpoints/checkpoint-3/logs-twilight.png`
  - `evidence/checkpoints/checkpoint-3/log-editor-twilight.png`
- visual result: log rows, the circular editor, duration hierarchy, glass cards,
  and toolbar treatment match the Swift screen structure. The Expo development
  client's floating tools control overlaps the add control in this debug build,
  so the editor route was also opened by deep link. That control is not present in
  production builds.
- review outcome: session validity remains centralized in domain rules, SQLite is
  the durable source of truth, and the editor does not duplicate date crossover
  math.

## Checkpoint 4: metrics fixture parity

- date: 2026-07-16
- gate: tasks 14-16 complete
- automated checks: `bun run test -- fixtures-parity --watchman=false` passed 30
  assertions across regular sleeper, shift worker, timezone traveler,
  sub-five-minute noise, and gaps/streak-break fixtures
- parity result: every expected core and advanced metric matched the hand-traced
  Swift fixture output. No tolerance widening or fixture exception was required.
- review outcome: metric constants and formulas remain in pure domain modules;
  presentation components consume prepared models and perform no formula math.

## Checkpoint 5: dashboard fidelity

- date: 2026-07-16
- gate: tasks 17-19 complete
- automated checks: greeting selection, dashboard models, WeekChart models, and
  chart-model tests pass in the full suite
- simulator: iPhone 17, iOS 27
- interaction checks: Week, 7-Night Avg, Score, and Core modes all render and
  switch live; 90D and All ranges remain interactive; the Week chart scrubs to
  individual nights
- palette checks: Twilight Night, Amethyst Night, and Twilight Sunset were
  inspected. The app was restored to Twilight Night afterward.
- evidence:
  - `evidence/checkpoints/checkpoint-5/dashboard-week-side-by-side.png`
  - `evidence/checkpoints/checkpoint-5/dashboard-average-side-by-side.png`
  - `evidence/checkpoints/checkpoint-5/dashboard-score-side-by-side.png`
  - `evidence/checkpoints/checkpoint-5/dashboard-core-side-by-side.png`
  - `evidence/checkpoints/checkpoint-5/settings-night-twilight.png`
  - `evidence/checkpoints/checkpoint-5/settings-night-amethyst.png`
  - `evidence/checkpoints/checkpoint-5/dashboard-core-sunset.png`
- audit correction: Score and Core cards were missing from the initially supplied
  Expo state. Commit `35a2ec3` restored both before this checkpoint was accepted.
- visual result: screenshot differences range from 40% to 46%. The major sources
  are different device/status-bar geometry, seeded dates and sessions, chart range,
  and intentional Expo theme rendering. Required dashboard structure and modes are
  present after the correction.
- review outcome: chart data is produced by domain screen models, shared card
  primitives remain reused, and the restored modes introduced no duplicate UI
  math. The autonomous side-by-side review required by the kickoff is complete;
  the saved comparisons remain available for later human audit.

## Checkpoint 6: complete screen walk

- date: 2026-07-16
- gate: tasks 20-24 complete
- automated checks: settings, onboarding, metrics screen models, and all metrics
  chart-model tests pass in the full suite
- interaction checks: Settings, Logs, Log Editor, Metrics overview, Momentum,
  Regularity, 14-night components, Recovery, and Behavior sections are reachable
  and render with seeded data
- evidence:
  - `evidence/checkpoints/checkpoint-6/side-by-side/settings.png`
  - `evidence/checkpoints/checkpoint-6/side-by-side/logs.png`
  - `evidence/checkpoints/checkpoint-6/side-by-side/log-editor.png`
  - `evidence/checkpoints/checkpoint-6/side-by-side/metrics-top.png`
  - `evidence/checkpoints/checkpoint-6/side-by-side/metrics-momentum.png`
  - `evidence/checkpoints/checkpoint-6/side-by-side/metrics-regularity.png`
  - `evidence/checkpoints/checkpoint-6/side-by-side/metrics-recovery.png`
  - `evidence/checkpoints/checkpoint-6/side-by-side/metrics-behavior.png`
  - `evidence/checkpoints/checkpoint-6/metrics-regularity-components-twilight.png`
- audit correction: the initially supplied Metrics route omitted the component
  filter, Momentum, Regularity, Recovery, Behavior, trend summaries, and footer.
  Commit `6f471e5` restored the complete source order and connected the All,
  Bedtime, Wake Time, and Accuracy filter to chart and summary data.
- visual result: the five audited metrics comparisons measured 14.71% to 24.19%
  pixel difference after restoration. Remaining differences are explained by
  theme implementation, device/status-bar geometry, data/date differences, and
  viewport alignment rather than missing content.
- review outcome: the Metrics screen composes focused section and chart
  components, filter state is local and typed, and all computed values originate
  in the metrics screen model.

## Checkpoint 7: animation, haptics, and notifications

- date: 2026-07-16
- gate: tasks 25-26 complete
- automated checks: animation parity, circular picker, notification permission,
  and scheduling tests pass in the full suite
- performance evidence: the saved metrics-scrub flow at
  `.argent/flows/profile-metrics-scrub.yaml` recorded 21 React commits, every
  commit below 16 ms, zero hot commits, zero native UI hangs, and 22 ms aggregate
  Reanimated frame work
- interaction checks: fade/slide entrances, press scales, picker pulse, moon
  breathing, starfield timing, chart scrub, and no-animation streak changes were
  swept on the iPhone 17 simulator
- notification checks: wind-down scheduling, rescheduling after bedtime changes,
  permission handling, and cancellation when disabled are covered by passing
  tests
- review outcome: animation timing and haptic assignments are shared rather than
  restated per screen. Physical haptic strength and distinction cannot be felt in
  a simulator and remain a physical-device check.

## Checkpoint 8: Live Activity lifecycle

- date: 2026-07-17
- gate: tasks 27-28 implementation complete; simulator lifecycle verified
- simulator: iPhone 17, iOS 27, dev client bundle
  `studio.orbitlabs.twilight.expo`
- interaction checks:
  - starting a session created a lock-screen Live Activity with Rejuvenating,
    elapsed time, goal remaining, and progress
  - the compact Dynamic Island presentation survived a full simulator reboot
  - relaunching the app restored the same active SQLite session
  - ending that restored session returned the dashboard to Go to Sleep and cleared
    the Dynamic Island from the home screen
  - lifecycle reconciliation, update, deduplication, and settings-toggle behavior
    are covered by passing service tests
- evidence:
  - `evidence/checkpoints/checkpoint-8/live-activity-lock-screen.png`
  - `evidence/checkpoints/checkpoint-8/live-activity-restart-compact-island.png`
  - `evidence/checkpoints/checkpoint-8/app-relaunch-active-session.png`
  - `evidence/checkpoints/checkpoint-8/live-activity-ended-home.png`
- fallback result: the documented Expo Widgets limitation prevents a durable,
  exactly-once direct wake mutation while the app process is suspended. The
  approved fallback ships wind-down state, richer island content, and a deep link,
  while foreground SQLite operations remain authoritative.
- review outcome: ActivityKit remains a projection of SQLite state, identifiers
  are isolated behind the service boundary, and relaunch reconciliation prevents
  duplicate or orphaned activities.
- pending external verification: expanded and interactive Dynamic Island behavior
  on physical hardware. No physical Dynamic Island device was connected.

## Checkpoint 9: Android boot

- date: 2026-07-17
- gate: task 29 complete
- emulator: Pixel 7 API 36 arm64, `twilight_api_36`, package
  `studio.orbitlabs.twilight.expo`
- interaction checks: the installed development build booted; Home, Metrics,
  Logs, and Settings all navigated; a session changed from Go to Sleep to an
  active Wake Up state and back; the sub-five-minute result remained excluded
  from valid logs
- evidence:
  - `evidence/checkpoints/checkpoint-9/android-home.png`
  - `evidence/checkpoints/checkpoint-9/android-metrics.png`
  - `evidence/checkpoints/checkpoint-9/android-logs.png`
  - `evidence/checkpoints/checkpoint-9/android-settings.png`
  - `evidence/checkpoints/checkpoint-9/android-active-session.png`
  - `evidence/checkpoints/checkpoint-9/android-session-ended.png`
- audit correction: commit `a6a84ce` fixed Android's first-run native picker
  lifecycle and verified the complete emulator flow. iOS-only Live Activity UI
  remains correctly absent.
- review outcome: platform differences are contained in guarded services and the
  shared time-picker field. No Android-only visual polish was added beyond the
  requested launch and blocking-layout scope.

## Final checkpoint: specification audit

- date: 2026-07-17
- full automated gates:
  - `bun run test -- --watchman=false`: 28 suites and 159 tests passed
  - `bun run typecheck`: passed
  - `bun run lint`: passed
  - `git diff --check`: passed
  - focused-test scan: no `.only` or `.skip` calls
  - prohibited-pattern scan: no `@ts-ignore`, `eslint-disable`, TODO, FIXME, or
    console calls; the two `any` matches are Jest's typed `expect.any(Date)`
- implementation result: all 29 todo tasks are checked, all four iOS and Android
  routes are walkable, core user flows persist correctly, metric fixture parity is
  green, dashboard and metrics omissions found during the audit were corrected,
  and `DEVIATIONS.md` records every intentional platform or framework difference
- commit history: task commits use lowercase conventional messages with the
  `twilight/gpt-5-6` scope. The shared-repository task 3 history exception is
  documented under Foundation in `DEVIATIONS.md`.
- device-only verification still pending:
  - physical-device haptic feel, which the task explicitly allowed to fall back
    to simulator verification
  - physical Dynamic Island expanded and interactive presentation, reported as
    unverified as required by the kickoff
