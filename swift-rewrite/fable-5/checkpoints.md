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
