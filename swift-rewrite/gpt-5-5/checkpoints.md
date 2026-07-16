# checkpoints

## checkpoint 1 - shared shell and chrome

covered tasks:

- task 1: Expo app scaffold, four-tab shell, iOS SF Symbols.
- task 2: domain models and sleep session rules.
- task 3: SQLite session repository and settings store.
- task 4: theme palettes and theme selection controller.
- task 5: shared screen chrome, starfield, moon accent, reusable glass cards, and tinted tab bar.

verification:

- `bun run test`: passed, 7 suites and 18 tests.
- `bunx tsc --noEmit`: passed.
- `bun run lint`: passed.
- `git diff --check -- .`: passed.
- em-dash scan over app files: no matches.
- Release iOS build succeeded for iPhone 17 Pro simulator
  `93EEF062-B4DC-4989-AF77-CF47EE2A9816`.
- Installed and launched release app bundle:
  `/Users/rami/Library/Developer/Xcode/DerivedData/Twilight-gdbapeqbfyfuisccwukhejoqtvbv/Build/Products/Release-iphonesimulator/Twilight.app`.

visual qa:

- Home screenshot:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-sN6PnM/media/627265000-1784196250627.png`.
- Metrics screenshot:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-sN6PnM/media/914274000-1784196264914.png`.
- Logs screenshot:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-sN6PnM/media/635408000-1784196276635.png`.
- Settings screenshot:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-sN6PnM/media/847240000-1784196287847.png`.
- Dashboard was corrected after review so the title no longer wraps and the active tab
  background is rounded instead of square.
- Every tab rendered the shared gradient, starfield, glass card surfaces, moon accent,
  and tinted floating tab bar.

code quality gate:

- Reviewed task 5 changes after implementation.
- Fixed JSX indentation in the placeholder screen.
- Made `ScreenChrome` accept an optional `AppTheme` instead of locking the component
  to twilight internally.

known gaps:

- In-app switching between twilight and amethyst is not available yet. The chrome
  accepts an injected theme, but the settings UI that will expose appearance selection
  is a later task.
- Star placement and the shooting-star trail are deterministic and static in this
  checkpoint. Full twinkle and moving shooting-star behavior is deferred to the
  animation pass.

## checkpoint 2 - risk burn-down spikes

covered tasks:

- task 6: expo-widgets live activity spike.
- task 7: dashboard Week chart approach spike.
- task 8: grayscale-while-asleep approach spike.

decisions:

- live activity: feasible for iOS dev builds with `expo-widgets`; production should
  keep widget closures self-contained and verify Dynamic Island polish on device.
- chart approach: use Victory Native for scales, Catmull-Rom lines, and press state;
  use custom Skia marks for floating sleep-window bars, dashed rules, labels, and
  selection overlays.
- grayscale while asleep: use desaturated theme palettes plus Skia `ColorMatrix`;
  do not build a native root color-filter module for the initial port.

verification:

- `bun run test`: passed, 10 suites and 29 tests.
- `bunx tsc --noEmit`: passed.
- `bun run lint`: passed.
- `git diff --check -- .`: passed.
- em-dash scan over app files: no matches.
- iOS dev build booted on iPhone 17 Pro simulator
  `93EEF062-B4DC-4989-AF77-CF47EE2A9816`.

visual and simulator evidence:

- task 6 lock-screen live activity rendered with progress and `Wake Up` button:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-aW8Jd6/media/372823000-1784198144373.png`.
- task 7 chart spike selected-state screenshot:
  `spikes/chart-approach/evidence/week-chart-spike-selected.png`.
- task 7 reference screenshot used for comparison:
  `/Users/rami/Documents/life-os/expo/content/videos/ai-model-comparison/prompt/test-3-tasks/twilight-swift-ui-screenshots/IMG_4796.PNG`.
- task 8 grayscale asleep toggle screenshot:
  `spikes/grayscale-while-asleep/evidence/grayscale-asleep-demo.png`.

code quality gate:

- Reviewed all spike code written since checkpoint 1 for correctness, isolation,
  release impact, naming, duplication, and documented decisions.
- Fixed repeated Watchman recrawl warnings by resetting the workspace watch.
- Fixed spike mounting so app screens load scratch components through dev-only
  dynamic imports instead of static imports.
- Confirmed spike artifacts are quarantined under `spikes/` and documented with
  decision notes.

known gaps:

- Live Activity permission and lock-screen button taps were partly limited by
  simulator accessibility. The lock-screen card and button rendered, and native
  interaction plumbing exists in `expo-widgets`, but a full lock-screen wake-button
  mutation should be verified on a physical iPhone.
- Metro logged a web bundling error for `expo-sqlite` resolving
  `wa-sqlite.wasm` during the dev session. Native iOS verification is unaffected,
  but web should be treated as not verified until that Expo SQLite web packaging
  issue is addressed.

## checkpoint 4 - metrics engine parity

covered tasks:

- task 14: core sleep metrics engine.
- task 15: advanced sleep metrics engine.
- task 16: golden metric fixtures and parity test.

verification:

- `bun run test -- metrics`: passed, 2 suites and 16 tests.
- `bun run test -- parity`: passed, 1 suite and 6 tests.
- `bun run test`: passed, 20 suites and 83 tests.
- `bunx tsc --noEmit`: passed.
- `bun run lint`: passed.
- `git diff --check -- .`: passed.
- `git diff --cached --check`: passed before the task 16 commit.
- em-dash scan over `src`, `tests`, `package.json`, and `tsconfig.json`: no matches.

fixture evidence:

- `tests/fixtures/sleep-metrics/regular-sleeper.json`: consecutive regular sleeper set with 14 nights.
- `tests/fixtures/sleep-metrics/shift-worker-crossing-midnight.json`: after-midnight shift-worker schedule.
- `tests/fixtures/sleep-metrics/timezone-traveler.json`: sessions with different start and end time zones.
- `tests/fixtures/sleep-metrics/sub-five-minute-noise.json`: invalid short sessions, same-day canonical selection, and active-session exclusion.
- `tests/fixtures/sleep-metrics/gaps-streak-breaks.json`: gaps, streak breaks, and current-streak behavior.

code quality gate:

- Reviewed the phase 4 metric modules and parity harness for task scope, pure-domain boundaries, deterministic date handling, fixture coverage, and dependency impact.
- Fixed the parity harness typecheck failure by removing Node `fs` and `path` usage instead of adding `@types/node` or changing global TypeScript config.
- Fixed negative-zero serialization in parity snapshots so fixture diffs remain stable.
- Confirmed the parity harness exercises public metric outputs rather than private helper internals.

known gaps:

- Checkpoint 3 is not present in this log. I did not backfill it because the current turn did not reproduce the full track-a-night simulator flow.
- The iOS runtime boot was not rerun for tasks 14-16 because this phase is pure TypeScript metrics work and the prior simulator state showed stale bundle contamination. Runtime boot remains unproven for the latest local commits.

## checkpoint 5 - dashboard fidelity

covered tasks:

- task 17: dashboard shell, greeting banks, status cards, mode controls, explanation sheet, and fade-in entrances.
- task 18: production Week chart using the chart spike approach.
- task 19: seven-night average card and alignment score card.

verification:

- `bun run test -- greetings`: passed, 1 suite and 4 tests.
- `bun run test -- week-chart-model`: passed, 1 suite and 4 tests.
- `bun run test -- dashboard-card-models`: passed, 1 suite and 3 tests.
- `bun run test`: passed, 24 suites and 96 tests.
- `bunx tsc --noEmit`: passed.
- `bun run lint`: passed.
- `git diff --check -- .`: passed.
- em-dash scan over `src`, `tests`, `package.json`, `tsconfig.json`,
  `DEVIATIONS.md`, and `checkpoints.md`: no matches.

visual qa:

- attempted iOS launch on simulator `93EEF062-B4DC-4989-AF77-CF47EE2A9816`.
- started this worktree's Expo server on port 8082, then stopped it after testing.
- launching `com.ramimaalouf.twilight-expo` rendered stale placeholder content with
  `Unimplemented component: <ViewManagerAdapter_ExpoLinearGradient>` instead of the
  current dashboard.
- `debugger-status` for port 8082 reported no React Native CDP targets connected.
- opening `exp://10.32.118.42:8082` failed because the simulator had no handler for
  the Expo URL.
- stale launch screenshot:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-ZSQ3sf/media/987187000-1784240537987.png`.

code quality gate:

- reviewed the dashboard code written since checkpoint 4 for task scope, metric
  source of truth, selection state, chart model test coverage, and chart library
  boundaries.
- fixed the shuffled greeting so it no longer resets every minute when the clock
  state changes.
- removed an unnecessary hidden settings text workaround from the Week chart axis
  labels.
- kept the chart model helpers separate from React rendering so offset math,
  seven-day anchoring, moving averages, alignment components, and deviation
  thresholds are unit-tested.

known gaps:

- checkpoint 5 does not pass the required manual side-by-side gate yet. Static
  checks and unit tests pass, but the current simulator install is stale and not
  loading this worktree's bundle.
- task 19 logs a visual approximation in `DEVIATIONS.md`: the moving-average card
  area fill is colored by latest target state instead of being split at every
  target crossing.
