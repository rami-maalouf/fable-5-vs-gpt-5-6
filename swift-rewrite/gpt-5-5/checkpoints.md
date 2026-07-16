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

- installed the current iOS debug app on clean simulator
  `7547AFAC-A35A-46C9-9924-488E2F2530CC` (`iPhone Air`).
- started this worktree's Expo server on isolated port 8095 with
  `bunx expo start --dev-client --port 8095`.
- set the simulator's React Native packager host override to
  `10.32.118.42:8095` via `RCT_jsLocation` because this app does not include
  `expo-dev-client`, so `expo-development-client` URLs only open the app and do
  not change the debug bundle URL.
- `debugger-status` on port 8095 confirmed the current app and simulator:
  project root `gpt-5-5`, device `iPhone Air`, app
  `com.ramimaalouf.twilight-expo`, connected `true`, loaded scripts `13`.
- Week mode rendered the dashboard greeting, segmented controls, last-night
  empty state, Week chart empty state, and floating tab bar:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-XwW5NK/media/678945000-1784242245679.png`.
- 7-Night Avg mode rendered the rolling-average empty state:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-XwW5NK/media/447189000-1784242254447.png`.
- Score mode rendered the alignment-score empty state:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-XwW5NK/media/28667000-1784242266028.png`.
- Core mode rendered the core-signals metric pills:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-XwW5NK/media/901092000-1784242287901.png`.
- root cause of the earlier stale launch: the debug app defaulted to Metro port
  8081, where a sibling app was already serving onboarding content. The stale
  screen came from sibling source, not this worktree.

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

- checkpoint 5 runtime loading is now verified on iPhone Air. Side-by-side with
  populated Swift reference data is still limited because this simulator state
  has no seeded sleep sessions; empty-state rendering was verified across all
  dashboard modes.
- task 19 logs a visual approximation in `DEVIATIONS.md`: the moving-average card
  area fill is colored by latest target state instead of being split at every
  target crossing.

## checkpoint 6 - remaining screens walkable

covered tasks:

- task 20: Settings tab, sleep goal pickers, appearance controls, wind-down toggle,
  sleep tips screen, and community section.
- task 21: four-step onboarding flow with schedule picker, notification permission
  step, root onboarding gate, completion persistence, and restart-onboarding path.
- task 22: Metrics screen shell with range picker, overview cards, highlights,
  empty state, timeline sheet, and explanation sheet.
- task 23: Metrics duration momentum, rolling consistency, and rolling component
  chart cards.
- task 24: Metrics sleep debt, weekday averages, duration histogram, and horizontal
  sleep-window timeline bars.

verification:

- `bun run test`: passed, 28 suites and 108 tests.
- `bunx tsc --noEmit`: passed.
- `bun run lint`: passed.
- `git diff --check -- .`: passed.
- em-dash and emoji scan over `src`, `app.json`, and `package.json`: no matches.
- iOS simulator runtime stayed connected to this worktree on iPhone Air
  `7547AFAC-A35A-46C9-9924-488E2F2530CC` through Metro port 8095.

visual qa:

- Settings tab rendered the scoped sections with persisted 9-hour goal and live
  appearance controls:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-dMyn0f/media/166129000-1784243392166.png`.
- Settings lower sections rendered wind-down, community, and restart-onboarding
  path:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-dMyn0f/media/127699000-1784243418128.png`.
- Sleep hygiene tips screen opened from Settings:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-dMyn0f/media/99775000-1784242962100.png`.
- Onboarding fresh gate rendered step 1, schedule picker, notification step,
  finish step, and completed back to the dashboard. Representative finish screen:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-dMyn0f/media/912648000-1784243365913.png`.
- Restart-onboarding dev path returned to onboarding step 1:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-dMyn0f/media/589081000-1784243433589.png`.
- Metrics shell rendered range picker, empty state, overview cards, highlights,
  Guide sheet, and Timeline sheet:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-dMyn0f/media/583255000-1784243847583.png`,
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-dMyn0f/media/513896000-1784243864514.png`,
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-dMyn0f/media/283776000-1784243885284.png`.
- Metrics chart sections rendered empty states for Detailed Trends, recovery, and
  behavior cards:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-dMyn0f/media/716278000-1784244201716.png`,
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-dMyn0f/media/872476000-1784244388872.png`.

code quality gate:

- used `code-review-and-quality` to review changes since checkpoint 5 across
  correctness, readability, architecture, security, and performance.
- tests cover pure settings, onboarding, metrics shell, and metrics chart models.
- confirmed app-facing settings and theme state remain centralized in
  `SleepAppearanceProvider`, while chart calculations stay in pure model modules.
- no blocking findings. The main watch item is file size: Settings, Onboarding,
  MetricsScreen, and MetricsCharts are each 468-567 lines. They remain under the
  1000-line warning threshold, but future additions should extract subcomponents
  before these files grow materially.

known gaps:

- populated side-by-side metrics chart parity is not fully proven in the simulator
  because checkpoint 6 used an empty local store. Empty states and route behavior
  were manually verified; metric chart models are unit-tested.
- task 24 timeline is implemented as the Metrics toolbar modal rather than a
  separate `timeline-sheet` route. This is logged in `DEVIATIONS.md`.
