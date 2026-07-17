# deviations

## task 1

- used Expo Router `Tabs` instead of `NativeTabs` for the initial scaffold. `NativeTabs`
  built and installed, but rendered a blank white screen on the simulator with no React
  Native accessibility tree. The stable `Tabs` navigator keeps the four-tab shell
  bootable while still rendering the required iOS SF Symbols through `expo-symbols`.
- kept routes under `src/app` because the existing SDK 57 starter is configured that
  way and Expo CLI confirmed `src/app` as the Expo Router root.

## task 2

- the shared external `todo.md` already had tasks 2-4 checked, but this app did not
  contain the task 2 domain files or tests. Treated the app worktree as authoritative
  and implemented task 2 before moving to later tasks.

## task 5

- the shared external `todo.md` was already checked through task 5, but this app did
  not contain the shared chrome implementation. Treated the app worktree as
  authoritative and implemented task 5 locally.
- manual visual verification was completed for the default twilight night palette.
  The reusable chrome accepts an `AppTheme`, and amethyst tokens exist from task 4,
  but in-app appearance switching is not exposed until a later settings task.
- the starfield uses deterministic static star placement with the required 40 stars
  and 8-circle shooting-star trail. Full animated twinkle and moving shooting-star
  parity is deferred to the later animation pass.

## task 6

- the shared external `todo.md` had task 6 checked, but this app did not contain
  a live-activity spike or decision note. Treated the app worktree as
  authoritative and added the local spike.
- the simulator verified lock-screen rendering and the compiled interactive
  button path, but Argent accessibility did not expose the Live Activities
  permission prompt or lock-screen button as tappable elements. The spike note
  documents this automation gap.

## task 7

- the shared external `todo.md` had task 7 checked, but this app did not contain
  a chart spike or decision note. Treated the app worktree as authoritative and
  added the local spike.
- chose a hybrid chart approach: Victory Native for scales, Catmull-Rom line
  rendering, and press state; custom Skia marks for floating sleep-window bars,
  dashed target rules, custom dual-axis labels, and selection overlays.

## task 8

- the shared external `todo.md` had task 8 checked, but this app did not contain
  a grayscale-while-asleep spike or decision note. Treated the app worktree as
  authoritative and added the local spike.
- chose desaturated theme palettes plus Skia `ColorMatrix` grayscale filtering
  over a native root color-filter module for the initial port.

## task 10

- the shared external `todo.md` had task 10 checked, but this app did not contain
  the sleep toggle implementation. Treated the app worktree as authoritative and
  implemented task 10 locally.
- the Swift sub-5-minute joke strings include emoji glyphs. The app keeps the same
  seven message variants and interpolation behavior, but omits emoji glyphs to
  satisfy the repo-wide no-emoji rule.

## task 11

- the shared external `todo.md` had task 11 checked, but this app did not contain
  app-wide sleep-state desaturation. Treated the app worktree as authoritative and
  implemented task 11 locally.
- removed the dev-only spike mounts from Home, Metrics, and Settings so scratch
  overlays and colorful spike demos no longer obscure or contradict the production
  sleep-state UI. The spike source and evidence remain under `spikes/`.

## task 17

- the Swift greeting banks include emoji glyphs. The app preserves the greeting bank
  structure and selection logic, but omits emoji glyphs to satisfy the repo-wide
  no-emoji rule.
- task 17 implements the dashboard shell, status cards, view controls, and metric
  summaries. Dense chart drawings remain intentionally bounded to the later chart
  tasks so the chart implementation is not duplicated here.

## task 19

- the moving-average card uses the shared metric engine and renders the target rule,
  selection point, and line, but its area fill uses one latest-state color instead
  of splitting exactly at every target crossing. The numeric behavior is preserved;
  the crossing-split fill can be tightened during the chart polish pass.

## tasks 20-24

- the shared external `todo.md` had tasks 20-24 checked, but this app still had
  placeholder Settings and Metrics tabs and no onboarding flow. Treated the app
  worktree as authoritative and implemented the missing local features.
- task 21 keeps the scoped four-step onboarding flow from `todo.md` and `plan.md`
  rather than the older six-step prose in the spec. Apple Health and NFC steps
  remain out of scope for this port.
- task 22-24 charts use the metric engine and render the required sections, but
  populated side-by-side visual parity is not fully proven because the simulator
  used for checkpoint 6 has no seeded sleep sessions. Empty states and route
  behavior are verified; numeric chart models are covered by unit tests.
  Pixel-level chart polish remains for the animation and visual pass.
- task 24 implements the timeline as the Metrics toolbar modal instead of a
  separate route file. It renders horizontal sleep-window bars inside the sheet;
  if deep-linking directly to the timeline becomes required, this should move to
  `src/app/timeline-sheet.tsx`.

## task 25

- aligned dashboard card entrance motion with the spec's y-offset and spring-based
  fade-in shape, and standardized press scale to 0.96 across newly reviewed
  pressable controls.
- shared `RoundedButton` now emits light haptics on press-in and shared
  `GlassButton` emits medium haptics on long press. Several feature-specific
  custom pressables still avoid haptics to prevent excessive buzzing in dense
  chart and settings controls; this can be revisited if physical-device testing
  shows the original app used haptics on those exact controls.
- FPS overlay was not available through the current simulator automation path.
  Starfield and chart interactions were manually smoke-tested for runtime
  stability, not measured with a numeric FPS trace.

## task 26

- the spec title includes a moon emoji. The app uses `Wind Down Time` without the
  emoji to satisfy the repo-wide no-emoji rule.
- notification resync is centralized in the settings provider so app launch,
  bedtime edits, and toggle changes share one scheduling path. Launch resync does
  not prompt for permission; toggling reminders on can request permission.
- the requested shortened-offset manual fire path is exposed through the service
  `offsetMinutes` injection and covered by focused tests, not by a separate dev
  settings screen.

## task 27

- promoted the Live Activity spike widget to the production `TwilightLiveActivity`
  instead of keeping a parallel widget target.
- the lock-screen Live Activity rendered on the simulator with title, elapsed and
  remaining time, progress, wake button, and the iOS Live Activities permission
  prompt. The prompt controls were not exposed through accessibility, so the prompt
  was not tapped from screenshot-derived coordinates.
- the real sleep-toggle path exposed an existing SQLite issue on the simulator:
  older local databases had `sleep_sessions.tag` as `NOT NULL`. Sleep mode sessions
  now use the stable `Sleep Mode` tag so the end-user start path works against that
  installed database.
