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
