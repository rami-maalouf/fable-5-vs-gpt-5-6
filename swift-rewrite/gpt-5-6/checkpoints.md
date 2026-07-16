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
