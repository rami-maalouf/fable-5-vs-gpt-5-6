# todo: twilight - swift to expo port

per-task checklist for `plan.md`. spec (`test-3-spec.md`) is normative for every
value referenced here (hexes, constants, geometry). standing definition of done for
every task: `bun run test` green, `bunx tsc --noEmit` clean, app still boots, one
conventional commit, deviations logged in DEVIATIONS.md.

## phase 1: foundation

- [x] **task 1: scaffold app + tooling**
  - description: fresh expo sdk 57 app in the working directory (skip create if
    already an expo app): typescript strict, expo-router with 4 placeholder tabs
    (home, metrics, logs, settings), jest-expo, lint, deps from the spec's stack
    table installed.
  - acceptance: `bunx expo run:ios` boots to the tab shell; all 4 tabs navigate;
    sf-symbol tab icons (house.fill, chart.xyaxis.line, list.bullet.clipboard,
    gearshape.fill).
  - verify: `bun run test`, `bunx tsc --noEmit`, manual boot on ios simulator.
  - depends: none. files: app/_layout.tsx, app/(tabs)/*, package.json, tsconfig,
    jest config. size: M

- [x] **task 2: domain models + session rules**
  - description: pure-ts `src/domain/models.ts` + `src/domain/session-rules.ts`:
    SleepSession/SleepSettings types, 300s validity rule, wake-day attribution
    (startOfDay of end_time in the session's tz), canonical-longest-night selection,
    tz-aware date helpers, duration/goal-match formatters.
  - acceptance: unit tests cover midnight crossing, dst shift, travel (start/end tz
    differ), sub-5-min invalidity, multi-session wake-day pick.
  - verify: `bun run test -- session-rules`.
  - depends: 1. files: src/domain/models.ts, src/domain/session-rules.ts, tests.
    size: M

- [x] **task 3: data layer**
  - description: `src/data/`: expo-sqlite `sleep_sessions` table per the spec schema,
    repository (create/end/update/delete/list-valid/active-session), kv settings
    store with spec defaults (dark mode, twilight palette, wind-down on, live
    activity on).
  - acceptance: repo round-trips sessions with tz fields intact; exactly one active
    session enforced; settings defaults match spec.
  - verify: `bun run test -- data`.
  - depends: 2. files: src/data/db.ts, src/data/session-repo.ts,
    src/data/settings-store.ts, tests. size: M

- [x] **task 4: theme module**
  - description: `src/theme/`: the three AppTheme palettes with the spec's exact hex
    tables, ThemeMode (system/light/dark) + palette (twilight/amethyst) selection
    logic (sunset = light mode, not a palette), ThemeProvider + useTheme, persistence
    via settings store.
  - acceptance: token unit test asserts every slot equals the spec table; mode +
    palette switching updates live; system mode follows os scheme.
  - verify: `bun run test -- theme`; manual switch on simulator.
  - depends: 3. files: src/theme/palettes.ts, src/theme/ThemeProvider.tsx, tests.
    size: S

- [x] **task 5: screen chrome**
  - description: shared visual shell: gradient background, skia StarfieldView (40
    stars, twinkle/shooting-star params per spec), GlowingMoonView (3 glow layers,
    3.0s breathing), CardBackground (radius 24, spotlight blob) and the standard
    card recipe wrapper (thinMaterial-equivalent via expo-blur, radius 20, white
    0.4-0.1 gradient stroke, shadow black 0.1 r10 y5), GlassButton, RoundedButton,
    tab bar tinted accent.
  - acceptance: every tab renders gradient + starfield behind content; card recipe
    component reused (no inline copies); side-by-side with original screenshot: same
    gradient stops, star density, card look.
  - verify: manual side-by-side, both night palettes.
  - depends: 4. files: src/components/common/*. size: L (split rendering from
    buttons into two commits if it drags)

**checkpoint 1:** shell boots themed, tests + typecheck green, chrome matches
original look.

## phase 2: risk burn-down (timeboxed spikes - decisions, not polish)

- [x] **task 6: spike - expo-widgets live activity**
  - description: read current expo-widgets docs (newer than training data); minimal
    live activity: start/update/end from js, then attempt an interactive button
    (button -> intent -> js/session mutation).
  - acceptance: written decision: superpower feasible as specced, or fallback
    (wind-down state + richer island content). throwaway code deleted or clearly
    quarantined.
  - verify: activity visible on simulator lock screen; decision note committed.
  - depends: 1. files: spike note + widgets/ scratch. size: S

- [x] **task 7: spike - chart approach**
  - description: render the hardest chart (dashboard week chart: negative-offset
    bars width 25, dual y-axis, dashed rulemarks, catmullRom line + points,
    x-selection) in victory-native.
  - acceptance: written decision: victory-native, hybrid, or hand-rolled skia -
    based on visual match vs the spec's chart table, scrub behavior, perf.
  - verify: spike screenshot vs original; decision note committed.
  - depends: 5. files: spike note + scratch component. size: S

- [x] **task 8: spike - grayscale-while-asleep**
  - description: compare desaturated-palette swap (+ skia saturation(0) on canvases)
    vs a native color-filter module for the app-root grayscale effect.
  - acceptance: written decision with chosen approach; if palette swap, the
    desaturated variants of both night palettes are generated and look right.
  - verify: toggle demo on simulator; decision note committed.
  - depends: 4. files: spike note. size: S

**checkpoint 2:** three decisions recorded; spec open questions 1-2 closed.

## phase 3: core sleep flow (spec priority 2)

- [x] **task 9: circular time picker component**
  - description: the signature component, standalone: size 280 ring per spec
    geometry (glow ring, track, 5-color angular-gradient arc with midnight split,
    hour markers/ticks, moon #7B68EE + sun #FFB347 knobs 52x52), drag math (atan2
    + 90 wrap, 35-degree grab, 5-min snap), haptics (light grab/snap, medium
    release), center duration display + quality copy.
  - acceptance: drag both knobs smoothly at 60fps; crossing midnight renders split
    arc; snap and haptics match spec; center updates live (48 bold rounded digits).
  - verify: component test for angle<->time math; manual feel test on device if
    available, else simulator.
  - depends: 5. files: src/components/common/CircularTimePicker.tsx, tests. size: M

- [x] **task 10: sleep toggle (minimal dashboard)**
  - description: go to sleep / wake up button (title3 bold white, radius 15,
    actionPrimary/warning backgrounds, card-recipe wrapper), creates/ends sessions
    via repo, elapsed timer while active, sub-5-min joke toast (7 messages,
    pluralized time) instead of saving celebration - session persists but is
    invalid per rules.
  - acceptance: toggle round-trip persists a valid session; sub-5-min shows joke
    and session hidden from all lists; exactly one active session.
  - verify: `bun run test`; manual toggle on simulator; kill + relaunch restores
    active state.
  - depends: 2, 3, 5. files: app/(tabs)/index.tsx, src/components/dashboard/,
    src/copy/jokes.ts. size: M

- [x] **task 11: grayscale-while-asleep**
  - description: apply the spike-chosen approach app-wide when a session is active
    (original: .grayscale(1.0) on the root, no explicit animation).
  - acceptance: entire ui desaturates while sleeping, restores on wake, across all
    tabs and both night palettes.
  - verify: manual toggle sweep through every screen.
  - depends: 8, 10. files: app/_layout.tsx, src/theme/. size: S

- [x] **task 12: logs list**
  - description: logs tab: valid sessions listed (day, start-end, duration badge),
    swipe to delete, tap to edit (opens editor from task 13), toolbar + for new,
    empty state.
  - acceptance: list shows only valid sessions attributed to wake day; delete
    removes from store; matches original row layout.
  - verify: `bun run test`; manual side-by-side with seeded data.
  - depends: 10. files: app/(tabs)/logs.tsx, src/components/logs/. size: S

- [x] **task 13: log editor sheet**
  - description: full-sheet editor (inline title, gradient toolbar): wake-day date
    picker + circular picker (task 9), live goal-match %, bedtime-crossing-midnight
    date sync, create ("Manual Log" tag) and edit paths.
  - acceptance: crossover logic tests pass (bed 23:00/wake 07:00 vs bed 01:00);
    goal match % matches formula; edits persist tz-correctly.
  - verify: `bun run test -- editor`; manual create/edit/delete cycle.
  - depends: 9, 12. files: app/log-editor.tsx, tests. size: M

**checkpoint 3:** track-a-night flow works end to end and matches the original side
by side.

## phase 4: metrics engine (spec formulas, pure ts)

- [x] **task 14: metrics core**
  - description: `src/domain/metrics/`: night records (18:00 base-hour offsets),
    mean/median/total/longest/shortest, tracking coverage, goal-hit rate (±0.75h),
    duration trend %, 7-day moving average series, current/longest streaks.
  - acceptance: unit tests per function incl. empty/1-night/gap inputs.
  - verify: `bun run test -- metrics`.
  - depends: 2. files: src/domain/metrics/core.ts, tests. size: M

- [x] **task 15: metrics advanced**
  - description: dashboard consistency (std-dev, -40pts/hr) + schedule accuracy
    (-30pts/hr), rolling 14-day consistency (bedtime/wake/accuracy), social jetlag
    (weekend vs weekday midpoint), cumulative sleep debt, weekday averages,
    duration histogram buckets, sleep alignment score (0.35/0.30/0.20/0.15
    weighted geometric mean + EMA 0.8/0.2 trend).
  - acceptance: unit tests pin every constant; alignment weights sum checked.
  - verify: `bun run test -- metrics`.
  - depends: 14. files: src/domain/metrics/advanced.ts, tests. size: M

- [x] **task 16: golden fixtures**
  - description: `tests/fixtures/`: five session sets (regular sleeper, shift
    worker crossing midnight, timezone traveler, sub-5-min noise, gaps/streak
    breaks) with expected outputs for every metric, derived by hand-tracing the
    swift implementation (`Utils/SleepMetricsAnalyzer.swift`,
    `Views/SleepDataModels.swift`).
  - acceptance: engine passes all fixtures; a mismatch is treated as a port bug.
  - verify: `bun run test -- fixtures`.
  - depends: 15. files: tests/fixtures/*.json, tests/parity.test.ts. size: M

**checkpoint 4:** fixture parity green.

## phase 5: dashboard fidelity (spec priority 3)

- [x] **task 17: dashboard layout**
  - description: full dashboard: greeting (9 banks + selection logic, tap to
    shuffle), date line, info button -> metrics-explanation sheet (detents
    0.6/large + drag indicator), view-mode segmented picker (Week / 7-Night Avg /
    Score / Core) + 90D/All toggle, last-night status card (34 bold duration,
    day-over-day %, streak flame with animation disabled on change), fadeInSlide
    entrances.
  - acceptance: typography/spacing per spec (vstack 16, card recipe); greeting
    logic unit-tested against the selection rules.
  - verify: `bun run test -- greetings`; manual side-by-side.
  - depends: 10, 14, 15. files: app/(tabs)/index.tsx, src/components/dashboard/*,
    src/copy/greetings.ts. size: M

- [x] **task 18: week chart**
  - description: the dashboard week chart per the spec's mark table: negative-offset
    bars (width 25, accent 0.7, r4), gray duration line (lw3 catmullRom) + points,
    three dashed rulemarks with annotations, dual y-axis with collision hiding,
    custom day+duration x-labels, selection rule + popover (radius 12, deviation
    colors green/yellow/accent).
  - acceptance: mark-for-mark match vs original screenshot with same seeded data;
    scrub selection works.
  - verify: manual side-by-side; fps overlay during scrub.
  - depends: 7, 17. files: src/components/charts/WeekChart.tsx. size: M

- [x] **task 19: 7-night avg + alignment score cards**
  - description: moving-average card (green/red 0.22 area segments split at target
    crossings, actionPrimary lw3 line, dynamic y-domain clamped 0-12 min-span 0.9)
    and alignment card (green/orange bars by 70 threshold, EMA trend line, target
    rule at 70, y-axis [0,25,50,70,100]), both with white selection point size 56.
  - acceptance: numbers come from the engine (no ui-side math); visuals match the
    spec table; height 220 each.
  - verify: manual side-by-side with fixture data seeded.
  - depends: 18. files: src/components/charts/MovingAverageCard.tsx,
    AlignmentCard.tsx. size: M

**checkpoint 5:** dashboard side-by-side approved by rami (both palettes + sunset).

## phase 6: remaining screens (spec priority 4-5)

- [x] **task 20: settings tab**
  - description: sleep goal (native time pickers writing minutes-since-midnight),
    appearance (palette picker: twilight/amethyst; mode: system/sunset/night),
    wind-down toggle + sleep hygiene tips screen, community links section.
  - acceptance: goal changes flow into metrics + editor goal-match; theme switches
    live; layout matches original settings sections in scope.
  - verify: manual side-by-side; `bun run test`.
  - depends: 4, 13. files: app/(tabs)/settings.tsx, app/sleep-tips.tsx. size: M

- [x] **task 21: onboarding**
  - description: 4-step flow (welcome -> sleep schedule with circular picker ->
    notification permission -> finish), gated at app root by is_onboarded; finish
    writes schedule + flag. same visual language as original steps (gradient
    toolbar, inline titles).
  - acceptance: fresh install lands in onboarding; completion lands on dashboard
    with goal set; restart-onboarding dev path works.
  - verify: manual fresh-install run; `bun run test`.
  - depends: 9, 20. files: app/onboarding/*. size: M

- [x] **task 22: metrics screen shell**
  - description: metrics tab: range picker (30D/90D/1Y/All), overview MultiStatCard
    grid, highlights, SectionTitle rhythm (lazyvstack 20), empty state, toolbar
    buttons (timeline sheet + explanation sheet).
  - acceptance: all numbers from the engine; empty state matches original.
  - verify: manual side-by-side at each range.
  - depends: 15, 17. files: app/(tabs)/metrics.tsx, src/components/metrics/*.
    size: M

- [x] **task 23: metrics charts - momentum + consistency**
  - description: duration momentum (target-colored bars + 7-night line lw2.5),
    rolling consistency (teal area/line + rule 80 + selection bubble), rolling
    14-night components (indigo/orange/green-dash lines lw2.8).
  - acceptance: mark-for-mark per spec chart table; scrub selection on each.
  - verify: manual side-by-side with fixture data.
  - depends: 22. files: src/components/charts/*. size: M

- [x] **task 24: metrics charts - debt, weekday, histogram, timeline**
  - description: sleep debt (accent line + 0.18 area + zero rule), weekday averages
    (purple weekend bars), duration histogram (% annotations), and the sleep/wake
    timeline sheet (horizontal bars bed->wake, indigo/orange points, detent 0.82).
  - acceptance: per spec chart table; timeline sheet presentation matches.
  - verify: manual side-by-side.
  - depends: 23. files: src/components/charts/*, app/timeline-sheet.tsx. size: M

**checkpoint 6:** every screen walkable side by side vs the original.

## phase 7: polish (spec priority 6)

- [x] **task 25: animation + haptics pass**
  - description: sweep every screen against the spec's animation/haptic map:
    fadeInSlide (spring 0.4/0.6, y30), press scales (0.96 spring 0.3), picker pulse
    2s, moon breathing 3s, starfield timings, haptic assignments (light/medium),
    streak indicator no-animation.
  - acceptance: no missing or extra animations vs original; 60fps on starfield +
    chart scrub with fps overlay.
  - verify: manual sweep with fps overlay; note results in DEVIATIONS.md.
  - depends: checkpoint 6. files: touched components. size: S

- [x] **task 26: wind-down notification + edge cases**
  - description: expo-notifications daily trigger 3h before bedtime (10 messages,
    title "Wind Down Time 🌙"), reschedule on bedtime change and app launch,
    permission handling; sweep empty states and error toasts.
  - acceptance: notification scheduled/rescheduled correctly (assert via
    getAllScheduledNotificationsAsync in test/dev screen); toggle off cancels.
  - verify: `bun run test -- notifications`; manual fire with shortened offset in
    dev.
  - depends: 20. files: src/services/notifications.ts, src/copy/winddown.ts,
    tests. size: S

**checkpoint 7:** polish pass done; fps + haptics verified.

## phase 8: live activity (spec priority 7)

- [ ] **task 27: live activity parity**
  - description: expo-widgets live activity matching the original: progress toward
    sleep goal, elapsed/remaining, dynamic island compact/minimal/expanded,
    "Rejuvenating..." title, start/end wired to session lifecycle, id persisted and
    restored on relaunch, settings toggle respected.
  - acceptance: activity appears on session start, updates, ends on wake; survives
    app kill + relaunch.
  - verify: simulator lock screen; physical device pass queued for checkpoint 8.
  - depends: 6, 10. files: widgets/*, src/services/live-activity.ts. size: M

- [ ] **task 28: superpower - interactive island + wind-down state**
  - description: per spike decision: interactive wake-up button on lock screen +
    expanded island ending the session, and a wind-down countdown state before
    bedtime. if the spike chose the fallback: wind-down state + richer island
    content, documented in DEVIATIONS.md.
  - acceptance: button ends the session without opening the app (or fallback
    shipped + documented); wind-down state renders at the right time.
  - verify: physical device (dynamic island); session state consistent after
    button press.
  - depends: 27. files: widgets/*, src/services/live-activity.ts. size: M

**checkpoint 8:** physical-device verification of island behavior.

## phase 9: android bonus (spec priority 8)

- [ ] **task 29: android boot**
  - description: `bunx expo run:android`; fix launch crashes and blocking layout
    breaks only (live activity is ios-only - guard it). no polish, per spec.
  - acceptance: app boots, all 4 tabs navigate, a session can be toggled.
  - verify: manual on emulator; screenshot for the record.
  - depends: checkpoint 7. files: platform guards as needed. size: S

**final checkpoint:** spec success-criteria checklist all green; DEVIATIONS.md
complete; commit history = one conventional commit per task.
