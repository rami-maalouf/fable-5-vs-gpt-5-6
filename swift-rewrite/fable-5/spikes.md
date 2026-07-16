# spike decisions (phase 2, jul 16)

timeboxed risk burn-down per plan.md. each spike ends in a decision, not polish.

## spike 1 (task 6): expo-widgets live activity - DECIDED: superpower feasible as specced

verified on iPhone 17e simulator (iOS 27, udid 624A675C), expo-widgets 57.0.5:

- start/update/end from js work (`createLiveActivity` factory; `getInstances()`
  finds live instances after the js context restarts - good for relaunch restore).
- lock screen renders the activity: title row, auto-updating elapsed timer
  (`Text date/dateStyle="timer"`), progress toward goal
  (`ProgressView timerInterval countsDown={false}` - same mechanism as the swift
  `ProgressView(timerInterval:)`), remaining countdown text.
- **interactive wake-up button works end to end**: `<Button target="wake-up">` in
  the layout compiles to a native `LiveActivityIntent`; tapping it on the lock
  screen fires `addUserInteractionListener` in js (event.source = activity
  instance id, event.target = the button target) while the app is backgrounded,
  and js can end the activity + mutate the session. evidence/task-06/*.png.

constraints learned (bind task 27/28):

- the `'widget'` directive compiler captures ONLY the component function body -
  module-scope constants (colors, targets) must be inlined inside the function or
  the extension js runtime throws ReferenceError at render.
- `event.source` is the activity instance uuid, not the declared name - match on
  target, not source.
- first start triggers an "Allow Live Activities" prompt; a second "continue to
  allow" prompt appears at the lock screen. plan for both in QA.
- after ending + restarting activities rapidly, the lock screen sometimes does
  not re-display the new activity immediately (instance is alive per
  getInstances). re-verify update visibility during task 27; not a feasibility
  blocker.
- cold-start edge: if the app process is dead, the intent launches it in the
  background; the js listener may attach after the event. task 28 must reconcile
  on launch (active session + no activity button event = check timestamps).

decision: build task 27 (parity) + task 28 (interactive wake-up + wind-down
state) as specced. no fallback needed.

## spike 2 (task 7): chart approach - DECIDED: hand-rolled skia chart kit

the hardest chart (dashboard week chart) was built directly with skia primitives
plus small pure helpers (`src/domain/metrics/chart-data.ts`,
`src/components/charts/path-utils.ts`) and compared against IMG_4796
(evidence/task-07/week-chart-skia.png, week-chart-selection-popover.png):
negative-offset range bars (r4, width 25, accent 0.7), gray catmullRom duration
line + points behind bars, three dashed rulemarks with leading/trailing
annotations, dual y-axis with the 31-minute collision hiding, two-line
day+duration x labels, and x-selection rule + centered popover with deviation
colors - all match mark-for-mark.

victory-native was evaluated against its installed API (v41.26): its `Bar`
draws only from the domain baseline - no yStart/yEnd range bars (checked
dist/cartesian/components/Bar.d.ts) - and dual axes with data-dependent label
hiding, leading/trailing rule annotations, split-color area segments (7-night
avg card), and two-line axis labels would all need custom skia escape hatches
anyway. rather than mixing two paradigms, ALL charts use the same hand-rolled
approach: pure scale math in the domain layer, skia marks, RN text overlays for
labels (native sf pro), band-based tap/pan selection. victory-native will be
removed from deps if still unused at checkpoint 6.

note: skia 2.6 deprecates SkPath.moveTo/cubicTo mutation - use
Skia.PathBuilder (already applied in path-utils.ts).

## spike 3 (task 8): grayscale-while-asleep - DECIDED: desaturated palette swap

- rn's `filter` style with `saturate(0)` was tried on the app root first: it is
  a no-op on ios (rn supports only brightness/opacity filters there; color
  filters are android-only). verified live on the simulator.
- a native UIView color filter is not viable either - CALayer.filters is
  macos-only api; ios apps cannot apply a compositing saturation filter to an
  arbitrary view tree.
- decision: **luminance-preserving palette swap** (`desaturateTheme` in
  src/theme/palettes.ts, rec.709 weights). ThemeProvider takes a `desaturated`
  prop; task 11 drives it from the active-session state. verified on the
  simulator: gradient, bars, accents, tab tint all go gray
  (evidence/task-08/grayscale-palette-swap.png).
- residue for task 11: components with fixed (non-theme) colors - chart rule
  colors (indigo/orange/green), the gold moon - must consume a desaturation-
  aware helper so they gray out too; skia canvases whose colors come from the
  theme need nothing extra.
