# checkpoints - nourish (fable-5 contestant)

handoff artifact between sessions. read this first, then `prompt/test-1-tasks/todo.md`
(the task list), `plan.md`, and `test-1-spec.md` in the same folder. the contestant
prompt `prompt/test-1-ai-calorie-tracker.md` is ground truth.

## environment facts (hard-won, do not rediscover)

- app root: this directory. router root is `src/app/` (NOT `app/` - see DEVIATIONS.md #1).
- bundle id: `com.ramimaalouf.nourish`. app display name: Nourish.
- metro: run on PORT 8087 (`bunx expo start --port 8087`), NOT 8081 - two other
  contestant agents (gpt-5-5, gpt-5-6) run concurrently on this machine and fight over
  8081. after any fresh install run:
  `xcrun simctl spawn <UDID> defaults write com.ramimaalouf.nourish RCT_jsLocation "localhost:8087"`
  or the debug app looks for metro on 8081 and shows "No script URL provided".
- simulators: iPhone 17 Pro (93EEF062-B4DC-4989-AF77-CF47EE2A9816) is SHARED with the
  other agents - they steal foreground focus mid-interaction. my verification device is
  **iPhone 17 Pro Max, iOS 27 (705C1405-E555-4C11-840D-A874D16FA712)** - use it
  exclusively. judging photos already added to its Photos library.
- HAZARD: a concurrent session periodically runs `git restore` + `git clean` at the
  shared repo root (this repo contains all three contestants). COMMIT IMMEDIATELY after
  every verified change. use pathspec commits (`git commit -m "..." -- <fable-5 paths>`)
  because the shared git index may contain other contestants' staged files (one of my
  commits accidentally swept in gpt-5-5 renames).
- another contestant ALSO named their app "Nourish" (bundle `com.rami.nourish`, keeps
  the starter Home/Explore tabs so far, similar coral widget). two "Nourish" entries
  appear in the widget gallery. disambiguate by published value, or verify only on the
  Pro Max where only my app is installed.
- jest: jest-expo 57 needs jest 29 (NOT 30) - already pinned. RNTL v14 `renderHook`
  and `act` are async - `await` them.
- `tsconfig.json` needs `"types": ["jest", "node"]` (TS 6 doesn't auto-include @types).
- the starter Welcome screen title contains a non-breaking space ("Welcome to Expo") -
  await-ui-element on "Welcome to Expo" fails; match "GET STARTED" instead.
- eslint 10 breaks eslint-config-expo; pinned eslint 9. `bun run lint` must stay clean.
- OPENAI_API_KEY lives in `.env` (gitignored). never log it or image base64.
- unsplash works for test images; wikimedia blocks curl.

## verification gates (before every commit)

`bunx jest --runInBand` + `bunx tsc --noEmit` + `bun run lint` all green.
never pipe jest output through head/tail directly - redirect to a scratch file, grep it.

## progress

### done and committed

- task 1 baseline: deps installed (expo-camera/image-picker/image-manipulator/haptics/
  svg, @openai/agents 0.13.4 + zod 4, jest-expo + RNTL + eslint), app.json has
  `web.output: "server"` + expo-widgets plugin (one RemainingCaloriesWidget,
  systemSmall only), jest+eslint configs, DEVIATIONS.md. commit `f0bbaf4`.
- task 2 route: `src/app/scan+api.ts` (MacroLens, gpt-5.6-luna, verbatim instructions,
  setTracingDisabled, input_text + input_image data-url parts, safe 400/502) +
  `src/domain/scan-contract.ts` (shared validation) + 21 route tests. commit `b5f487b`.
  REAL-KEY E2E PROVEN: clean-dish.jpg -> 200 {"food":"Grilled chicken and vegetable
  salad bowl...","calories":550,"protein_g":42,"carbs_g":45,"fat_g":22,
  "confidence":0.88} in ~3s; not-food.jpg -> {"error":"not_food"}; empty image -> 400.
- judging inputs committed: `verification/test-1/inputs/{clean-dish,mixed-plate,not-food}.jpg`
  (salad bowl 1024x1024, grill platter 1024x1536, circuit board 1024x683). commit `4bc31f4`.
- task 4 domain: `src/domain/nutrition.ts` (goals, totals, rounding, clamping,
  createMeal) + `src/domain/scan-machine.ts` (reducer: acquiring/preparing/analyzing/
  result/not_food/failed/closed, request-id staleness, accept-once) + 55 tests.
  commit `66fd4b1`.
- task 5 day state: `src/state/day-context.tsx` (meals-only reducer, derived summary,
  idempotent acceptMeal, widget publish effect), `src/services/widget.ts`
  (publishRemainingCalories -> updateSnapshot, ios-only guard),
  `widgets/RemainingCaloriesWidget.tsx` (spike design: Nourish mark, big number,
  "calories left"), `_layout.tsx` wraps DayProvider. commit `edae006`.

### task 3 (widget proof) - DONE, checkpoint 1 complete

- verified on the Pro Max: widget in gallery, added to home screen, showed the spiked
  published value 1789, then refreshed to 2000 after the spike revert + app restart.
  updateSnapshot round trip proven in both directions. spike reverted; working tree
  matches committed state. widget files were committed in `edae006`.
- home-screen jiggle recipe that works: gesture-custom Down + 5 tiny Moves at ~300ms
  + Up on empty wallpaper, then "Edit" (top-left) -> Add Widget -> search "Nourish".
- tasks 1-5 and checkpoint 1 boxes are ticked in todo.md.

- task 6 dashboard: `src/theme/tokens.ts` (semantic light/dark colors, spacing, radius,
  type scale, motion; `getColorTokens` accepts any scheme string because RN 0.86
  ColorSchemeName includes 'unspecified') + `src/theme/use-theme-colors.ts` hook.
  dashboard components in `src/components/dashboard/`: CalorieRing (svg ring, RN
  Animated strokeDashoffset, accessible progressbar role + accessibilityValue),
  MacroBar (animated fill, consumed/remaining labels, over-goal color treatment),
  NutritionSummary (calorie card + 3 macro bars), MealList (designed empty state,
  image-led rows with per-meal a11y labels + thumbnail testIDs), ScanButton (floating
  pill, svg camera glyph, 56pt, inert until /scan exists in task 7). `src/app/index.tsx`
  renders only from useDay() selectors; status-bar scrim stops scrolled content
  colliding with the clock. `_layout.tsx` = expo-router Stack in ThemeProvider (nav
  theme from tokens) + DayProvider, StatusBar auto. deleted ALL starter screens/
  components (explore, app-tabs*, animated-icon*, web-badge, hint-row, external-link,
  themed-*, collapsible, use-theme, constants/theme, global.css; kept
  use-color-scheme*). 5 new RNTL tests (87 total). commit `6eff8f6`.
  visually verified on the Pro Max: empty light + dark modes clean; fixture-populated
  layout reviewed via a temporary seeding spike (3 meals, unsplash thumbs) then spike
  reverted - populated arithmetic, bars, rows, and scroll clearance all correct.

### task-6 test/tooling gotchas (hard-won)

- RNTL `getByRole` only matches Views that set `accessible` explicitly.
- expo-image normalizes `source={{ uri }}` to an ARRAY: assert `[{ uri }]`.
- `git commit --amend -- <paths>` fails if the pathspec names files deleted in HEAD;
  amend with only the newly-changed paths instead.

- task 7 library scan input: `src/app/scan.tsx` full-screen modal (registered in
  _layout Stack with presentation 'fullScreenModal'; ScanButton now does
  router.push('/scan')). screen owns useReducer(scanReducer); closed -> router.back().
  `src/components/scan/AcquisitionView.tsx` (Take photo placeholder with honest
  "coming in a later build" hint since camera is task 10, Choose from library, 44pt
  close, both themes). `src/services/prepare-image.ts` (SDK 57 context api:
  ImageManipulator.manipulate(uri) -> optional resize -> renderAsync -> saveAsync
  {format jpeg, compress 0.82, base64 true}; resize ONLY when long edge > 1024,
  aspect preserved, raw base64 with defensive data-url strip). picker:
  launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false,
  quality: 1 }); cancel -> acquisition with no error; prep failure -> acquisition
  with a readable notice (local presentation flag, machine still owns flow).
  photo stays mounted full screen (expo-image cover) with scrim pill overlay
  through preparing -> analyzing; analyzing does not resolve yet (client call is
  task 8) and discard works from it. tokens gained stageBackground/stageScrim/
  onStage (same in both themes). 17 new tests (104 total). commit `241ea6b`.
  sim-verified on the Pro Max: scan button -> modal, picker cancel -> acquisition
  no error, salad-bowl selection -> full-screen photo -> analyzing pill over the
  SAME photo, discard from analyzing -> unchanged dashboard, dark-mode acquisition
  + camera hint clean.

### task-7 gotchas (hard-won)

- expo-router imports pull in `standard-navigation` (esm) - added to jest
  transformIgnorePatterns whitelist or every suite importing expo-router breaks.
- RNTL v14 `render` is async too - `await render(...)` or `screen.*` throws
  "`render` function has not been called".
- expo-image with accessible+role image reads back as AXTextField in describe;
  target it by its accessibilityLabel/testID instead of role.
- typed routes regenerated fine with metro already running on 8087; tsc green
  right after creating src/app/scan.tsx.

- task 8 real analysis + result card: `src/services/analyze-photo.ts` (relative
  fetch('/scan'), json body { image }, 200 -> parseScanResponse at the boundary,
  invalid 200 body / non-200 -> failure 'analysis', fetch throw -> 'network',
  AbortSignal support, never throws: returns typed AnalysisOutcome incl 'aborted';
  never logs payloads). scan.tsx: analyzing effect starts exactly ONE request per
  requestId (startedRequestIdRef guard), dispatches
  analysis_succeeded/not_food/failed with that requestId; AbortController aborted
  on discard AND unmount; 'aborted' outcome dispatches nothing.
  `src/components/scan/AnalyzingOverlay.tsx` (scrim pill, small svg arc spinner
  rotating via RN Animated; reduce-motion -> opacity pulse only, no transforms).
  `src/components/scan/ResultCard.tsx` (bottom card over the same mounted photo:
  AI ESTIMATE chip, food name 2-line, big calories + "estimated calories",
  protein/carbs/fat cells with macro-token dots via formatGrams, Discard +
  Accept 52pt actions above the home indicator; entrance fade+translate,
  reduce-motion fade only; accept disabled after first press - day-state logging
  is task 9; confidence not shown). `src/theme/use-reduced-motion.ts` hook.
  not_food/failed render minimal readable scrim-pill placeholders (task 11 will
  replace). 17 new tests (122 total). commit `91683b0`.

### task-8 REAL sim results on the Pro Max (verification evidence)

both through metro 8087 + the real key, photo identical analyzing -> result,
discard after each returned to an unchanged empty dashboard (2000 left, 0g):

- salad bowl (clean dish): "Grilled chicken salad bowl with mixed vegetables,
  corn, edamame, eggs, and greens" - 620 cal, protein 45 g, carbs 48 g, fat 25 g
- grill platter (mixed plate): "Assorted grilled meat skewers with roasted
  vegetables and dipping sauces" - 1800 cal, protein 130 g, carbs 75 g, fat 105 g

### task-8 gotchas (hard-won)

- eslint react-hooks/refs (new rule) rejects `useRef(new Animated.Value()).current`;
  use `const [v] = useState(() => new Animated.Value(0))` like CalorieRing.
- scan-acquisition tests must mock analyze-photo (never-resolving promise) or the
  real client fires in jest, fails fast as 'network', and analyzing disappears.
- RNTL v14 unmount cleanup is async: assert post-unmount effects inside waitFor.
- picker presentation occasionally swallows the first "Choose from library" tap
  right after the modal push animation - re-describe and tap again.

- task 9 accept/discard end to end: scan.tsx wires ResultCard accept into day
  state - success haptic (expo-haptics notificationAsync) on first press only
  (ref guards same-frame double taps), dispatch 'accept' (machine locks the
  button), acceptMeal(createMeal(result, `scan-${requestId}`, photo.uri,
  Date.now())) so day-state id idempotence also blocks duplicate logging, and
  the modal close moved into an effect on `closed || (result && accepted)` so
  dismissal is requested only in the commit that already contains the meal
  (widget publish effect fires in the same commit). scan-acquisition and
  scan-result suites now wrap ScanScreen in a real DayProvider (widget +
  haptics mocked); new tests/components/scan-accept.test.tsx (4 tests, 126
  total): accept-once with prepared thumbnail + id scan-1 under repeated
  presses, probe summary === accepted result === widget publish value (1450
  from a 550-cal fixture), discard changes nothing (publish count frozen at
  the mount publish), and mockBack observed the meal already committed when
  dismissal was requested. commit `ea40c60`.

### task-9 REAL sim results on the Pro Max (verification evidence)

metro 8087, real key, cold restart first (dashboard + widget both 2000):

- ACCEPT flow (salad bowl): "Grilled chicken salad bowl with vegetables,
  edamame, corn, and quail eggs" - 620 cal, protein 48 g, carbs 42 g, fat 27 g.
  modal closed straight to the dashboard: 1380 left (2000 - 620), ring
  partially filled, protein 48g of 150g (102g left), carbs 42g of 250g
  (208g left), fat 27g of 70g (43g left), one meal row with the salad photo
  thumbnail, "620 kcal", "48g P - 42g C - 27g F". home-screen widget showed
  the identical 1380 "calories left".
- DISCARD flow (mixed plate, same app session): "Mixed grilled meat platter
  with vegetables, potatoes, flatbread, and sauces" - 1800 cal, protein 110 g,
  carbs 95 g, fat 105 g. discard returned to a byte-identical dashboard
  (still 1380 / one meal) and the widget stayed 1380.
- arithmetic check: 2000 - 620 = 1380; 150 - 48 = 102; 250 - 42 = 208;
  70 - 27 = 43. all displayed values match exactly.
- checkpoint 3 complete; checkpoint-2 leftover box (widget snapshot vs day
  selectors with real meals) now proven and ticked.

### task-9 gotchas (hard-won)

- three back-to-back fireEvent.press calls in one act frame leave "overlapping
  act() calls" that poison every LATER test in the same jest file (mount
  effects stop flushing, renders come up empty). press once, await the settled
  assertion, then press again for lock coverage.
- accept must close via an effect, not synchronously in the press handler,
  or the dismissal is requested before the commit that contains the meal.

- task 10 camera acquisition: `src/components/scan/CameraView.tsx` exports
  `CameraCapture` (expo-camera CameraView rear preview, useCameraPermissions
  requested ONLY on choosing "Take photo", 76pt shutter disabled until
  onCameraReady, capture haptic impactAsync Medium, captureInFlightRef blocks
  double shutter, captured frame frozen as expo-image over the live preview +
  "Preparing photo" pill so the handoff has no blank frame, denied/unavailable
  explanation keeps "Choose from library" + close). scan.tsx: `cameraOpen`
  presentation flag; camera renders during acquiring AND preparing (frozen
  frame covers prep), shared `runPreparation(source)` used by BOTH camera and
  library -> same start_preparing/photo_prepared events, finally releases
  cameraOpen. AcquisitionView placeholder hint removed, onChooseCamera prop.
  app.json got the expo-camera plugin with the custom cameraPermission string.
  8 new tests in tests/components/camera.test.tsx (134 total). commit `5bbb2ca`.

### task-10 REAL sim results on the Pro Max (verification evidence)

- granted path: Scan -> Take photo -> system camera dialog appeared ON DEMAND
  -> Allow -> full-screen dark stage, close inside top safe area, shutter
  centered above home indicator (enabled once onCameraReady fired - it DOES
  fire on the ios 27 pro max sim). shutter tap CAPTURED for real: the sim's
  test frame (black + orange timestamp) froze in place, prepared, hit the real
  backend, and MacroLens returned not_food - full shared-pipeline round trip
  from a camera capture. capture is NOT device-limited on this runtime.
- denied path: settings-permissions deny + relaunch -> "Camera access needed"
  explanation (mentions Settings, doesn't depend on it), coral "Choose from
  library" + close reachable; library pick FROM the denied view went straight
  into the shared pipeline (salad full screen -> analyzing).
- library regression: salad bowl -> result card "Grilled chicken salad bowl
  with vegetables, edamame, corn, tomatoes, cucumber, cabbage, and boiled
  eggs" 620 cal / 48g P / 45g C / 25g F -> discard -> dashboard unchanged
  (2000, no meals).
- observed TWO transient analysis failures ("The analysis did not work this
  time." over the photo) before a success on the same image; a direct curl to
  /scan returned 200 in 2.3s, so this is provider flakiness, not the app.
  task 11's "Retry analysis" will absorb this.
- custom permission string: required prebuild + second rebuild (see gotcha);
  after permission reset the dialog showed "Nourish uses the camera to
  photograph your meal for calorie analysis." verbatim. Allow -> preview with
  shutter; camera close -> acquisition; scan close -> unchanged dashboard.
  sim left GRANTED for future sessions.

### task-10 gotchas (hard-won)

- `expo run:ios` does NOT re-sync config-plugin changes into an existing ios/
  dir: the first rebuild shipped the DEFAULT camera-permission string. run
  `npx expo prebuild --platform ios --no-install` after any plugin change,
  then rebuild. prebuild also rewrites package.json ios/android scripts to
  `expo run:*` - revert that.
- the modal push/dismiss animation swallows the first tap on freshly revealed
  buttons ~50% of the time; sequence taps with a describe/await between, and
  be ready to re-tap.
- RNTL v14 flushes press-triggered state asynchronously: after fireEvent.press
  always waitFor the next screen before asserting (sync asserts see the OLD
  tree). two back-to-back shutter presses in one act frame ALSO poison later
  tests (task-9 gotcha applies to any double press): press, waitFor the mock
  call, then press again while the controlled promise is still pending.
- ios sim CAN capture: takePictureAsync returns a black test frame on the
  iphone 17 pro max / ios 27 runtime; don't assume capture is device-only.

- task 11 failures/retries/cancellation: `src/components/scan/ErrorCard.tsx`
  (bottom card over the still-mounted photo, same fade+translate entrance as
  ResultCard, reduce-motion fade only; stageScrim layer dims the photo behind
  the card; three variants: not_food "That doesn't look like food" + "Try
  another photo", network "Couldn't reach the analyzer" + "Check your
  connection...", analysis "Analysis failed"; recoverable variants use
  "Retry analysis"; all actions 52pt, accessible roles/labels,
  accessibilityLiveRegion polite). scan.tsx: placeholder pills removed,
  ErrorCard wired (try_another_photo / retry_analysis dispatches), analyzing
  effect defensively aborts any leftover controller before starting a new
  request (the reducer serializes requests, so it is belt and braces).
  tests/components/scan-errors.test.tsx (10 tests, 144 total): not-food ->
  try-another -> fresh pick reaches result; network retry re-sends the SAME
  base64 (prepareImage called once); analysis variant distinct copy; rapid
  double retry starts exactly one replacement request and accept logs
  scan-2 (latest requestId); stale failure resolving after discard changes
  nothing; discard from all three error cards leaves day state + publish
  count untouched; discard/unmount during a retry abort the in-flight
  signal. commits `73aa103` (code) + checkpoint/todo commit.

### task-11 REAL sim results on the Pro Max (verification evidence)

- non-food: circuit board via library -> real backend not_food -> card over
  the dimmed photo, "Try another photo" -> acquisition -> salad bowl ->
  real result "Grilled chicken salad bowl with vegetables, edamame, corn,
  and eggs" 650 cal / 48g P / 45g C / 29g F -> discarded, dashboard clean.
- network failure PROVEN LIVE: killed the metro process (bundle already
  loaded), scanned the salad bowl -> fetch failed -> "Couldn't reach the
  analyzer" card over the same photo. restarted `bunx expo start --port
  8087` (status 200 in 3s), tapped "Retry analysis" -> the SAME photo
  analyzed without re-picking -> result 620 cal / 48g P / 48g C / 25g F ->
  discarded.
- discard-from-error isolation: fresh not_food card -> card's Discard ->
  dashboard byte-identical (2000 left, 0g macros, no meals) and the
  home-screen widget still shows 2000.
- both card variants readable over a dark (circuit board) and bright
  (salad) photo in light mode; scrim + opaque surface card hold contrast.

### task-11 gotchas (hard-won)

- killing metro pops the RN "Open debugger to view warnings" banner over
  the floating scan button; dismiss it via the small circle at its right
  edge (~0.93, 0.935) before tapping scan.
- two fireEvent.press retries in ONE act frame re-trigger the task-9
  poisoning (later tests in the file render empty); press retry, waitFor
  the second analyze call, then press the stale button reference to prove
  the reducer ignores it.
- metro on 8087 was killed and restarted during this session (nohup,
  detached); verify http://localhost:8087/status = 200 before relying on it.

- task 12 motion polish: `src/components/scan/ScanPhotoStage.tsx` (one persistent
  photo stage: base layer keeps the ORIGINAL display uri - raw library asset or
  frozen camera frame - mounted through preparing/analyzing/result/errors; the
  prepared jpeg crossfades in above it only after onLoad, so no swap or blank
  frame is possible; reduce-motion swaps the fade for an immediate opacity set).
  scan.tsx keeps `stageDisplayUri` so the base uri survives status changes.
  AnalyzingOverlay gained a quick fade+rise entrance (reduce-motion fade only);
  ResultCard/ErrorCard already had theirs. CalorieRing + MacroBar animate from
  the previously displayed value to the state-derived target over motion.settle
  (550ms, inside the 450-650 window), stop+restart cleanly on retarget, and
  snap immediately under reduce-motion. NEW `src/components/dashboard/
  AnimatedNumber.tsx` counts the big remaining number and macro gram labels
  from previous to new over the same settle duration (listener-driven display
  state; lands exactly on the derived target; reduce-motion = immediate).
  MealList rows fade in with a small rise (opacity-only under reduce-motion)
  without moving the floating scan button. 149 tests. commit `f1fa0ef`.

### task-12 CROSS-SESSION MEAL-ID BUG (found live, fixed in `f1fa0ef`)

- meal ids were `scan-${requestId}` but request ids RESTART at 1 per scan
  modal session, so the 2nd+3rd accepted meals of a day could share id
  "scan-1" and day-state id-idempotence SILENTLY DROPPED the third accept
  (observed live on the pro max: third accept closed the modal, dashboard
  stayed at 420 over / 2 meals). fix: module-level scan session counter in
  scan.tsx; ids are now `scan-<session>-<requestId>`. regression test:
  scan-accept "logs a second meal from a fresh scan session"; id assertions
  are now /^scan-\d+-1$/ style patterns.

### task-12 REAL sim results on the Pro Max (checkpoint-5 motion evidence)

metro 8087, real key, cold restart (2000/no meals), full flow recorded to
/tmp/motion-check.mov (xcrun simctl recordVideo, h264):

- meal 1 salad bowl: "Grilled chicken and vegetable salad bowl with eggs,
  edamame, corn, tomatoes, cucumber, cabbage, and lettuce" 620 cal / 48P /
  48C / 25F -> dashboard settled 1380 left, 102g/202g/45g left. (two
  transient "Analysis failed" cards first; "Retry analysis" on the SAME
  photo succeeded on the 3rd try; direct curl to /scan returned 200 in
  1.6s, so provider flakiness again, not the app.)
- meal 2 mixed plate: "Mixed grilled meat skewers with roasted vegetables,
  potatoes, flatbread, and dipping sauces" 1800 cal / 120P / 90C / 105F ->
  settled 420 over, protein 168g (18g over), carbs 138g (112g left), fat
  130g (60g over).
- meal 3 salad again (the id-collision case): 550 cal / 42P / 42C / 23F ->
  settled 970 over, protein 210g (60g over), carbs 180g (70g left), fat
  153g (83g over). THREE meal rows present.
- arithmetic: 620+1800+550=2970, 2000-2970=-970; 48+120+42=210 (60 over);
  48+90+42=180 (70 left); 25+105+23=153 (83 over). every displayed value
  exact.
- recording frames (ffmpeg fps=8) around accept 3 show the modal handoff
  with no blank frame and ALL FOUR indicators counting together: 705 over /
  189.8g / 159.8g -> 883 / 203.3g / 173.3g / 149.4g -> 950 / 208.5g ->
  settled 970/210/180/153. photo identical across analyzing/failed/retry/
  result in every scan. day reset via restart-app afterwards.

### task-12 gotchas (hard-won)

- eslint react-hooks/set-state-in-effect rejects sync setState in an
  effect body; AnimatedNumber's reduce-motion branch relies on
  animated.setValue notifying its listener (which sets display state in a
  callback) instead.
- dashboard.test.tsx seeds meals AFTER mount, so animated numeric texts
  need waitFor (they count for ~550ms); progressbar accessibilityValue and
  a11y labels update immediately (derived from props, not animated nodes).
- simctl recordVideo is VFR; input-side `ffmpeg -ss` can return zero
  frames - use output-side seeking (`-i file -ss T`) or `-sseof`.
- a PREVIOUS session bulk-ticked ALL todo.md boxes through task 17 (commit
  17384c6); unticked tasks 13-17 + checkpoint 5 + final checkpoint to
  restore honesty. tasks 1-12 + checkpoints 1-4 remain ticked.

### next: tasks 15-17 (evidence capture + final audit)

capture happy-path screenshots/recording, resilience + theme evidence, widget
before/after evidence, verification.md, and the full final audit (tests, lint,
tsc, web export, secret scan). checkpoint 5 status: motion recordings (task 12),
theme/a11y/reduce-motion sweeps (task 13), and final widget vs dashboard values
(task 14) all verified; the remaining box is the full-gate pass incl
`bunx expo export --platform web --no-ssg` from the final tree - run it in task 17.

### task 11 (resilience) - DONE, checkpoint 4 complete

- the task-11 subagent died on an api-credits error AFTER committing `73aa103`
  (ErrorCard.tsx with distinct not-food vs network/analysis variants, scan.tsx wiring,
  scan-errors tests). the orchestrator then verified everything: gates green
  (144 tests / 14 suites, tsc, lint), and full sim verification on the pro max:
  1. circuit board -> real not_food -> "That doesn't look like food" card ->
     "Try another photo" -> salad bowl -> real result (620 cal / 48P / 45C / 27F).
  2. metro killed mid-day -> scan salad -> "Couldn't reach the analyzer" network card
     over the same photo -> metro restarted -> "Retry analysis" -> SAME image succeeded
     (620 cal / 42P / 48C / 28F, ~1.7s). note: killing metro pops a dev banner
     ("Open debugger to view warnings") that blocks the scan button - dismiss via the
     gray circle at (0.93, 0.936) before tapping.
  3. discard from result and from error cards left dashboard + widget at 2000/no meals.
- task 11 + checkpoint 4 boxes ticked in todo.md.
- SUBAGENT CREDITS HAZARD: spawned subagents can die mid-task on "out of usage
  credits" api errors. check `git log` for partial commits before redoing work.

### task 13 (theme/accessibility audit) - DONE

- the task-13 subagent (died on session limit) completed the audit code across 10
  files: maxFontSizeMultiplier caps (fontScaleCap tokens) on dense rows, voiceover
  labels/roles/reading order, analyzing live-region + ios announce, theme fixes,
  status-bar behavior, plus tests/components/accessibility.test.tsx. gates were green.
- orchestrator finished the remaining verification and found + fixed a REAL crash:
  `transform: reducedMotion ? undefined : [...]` throws "Cannot read property
  'forEach' of null" in the native animated style validator when reduce motion is ON.
  fix: omit the transform key entirely via a conditional style-array entry. applied in
  AnalyzingOverlay (2x), ResultCard, ErrorCard, MealList. full real scan verified on
  the pro max WITH reduce motion enabled (result 620 cal), then reduce motion reset to
  off, appearance light. committed `8a21555` (156 tests / 16 suites, tsc, lint green).
- lesson: never write `transform: cond ? undefined : [...]` inside an animated style
  object - always conditionally include the whole object.

### task 14 (final widget design + snapshot consistency) - DONE

- `widgets/RemainingCaloriesWidget.tsx` final design: coral "Nourish" wordmark +
  compact progress ring top row (HStack + Spacer), big bold remaining number
  (42pt, monospacedDigit, minimumScaleFactor 0.6), "calories left" secondary
  label. the ring is `@expo/ui` `Gauge` with `gaugeStyle('circularCapacity')`
  (maps to SwiftUI `.accessoryCircularCapacity` per
  node_modules/@expo/ui/ios/Modifiers/GaugeStyleModifier.swift) + `tint(accent)`
  + `scaleEffect(0.6)` + `frame(32x32)` - a TRUE partial-arc capacity ring, no
  approximation needed. literal colors mirror tokens.ts light/dark (widget code
  cannot use rn hooks); `environment.colorScheme` switches them.
- adapter: `publishRemainingCalories(remaining, progress)`; day-context is the
  only caller and derives progress via `clampProgress(consumed, DAILY_GOALS.calories)`.
- tests: new tests/components/widget-sync.test.tsx (6 tests: mount 2000+0,
  sequential exact values incl over-goal clamp to 1, duplicate-accept publishes
  nothing, rounding, ios-only guard via jest.replaceProperty). day-context +
  scan-accept assertions updated to the 2-arg signature. 161 tests / 17 suites,
  tsc + lint green. commits `ed2644a` (code) + `0e5d81d` (new test file - NOTE:
  untracked files need `git add` before a pathspec commit).
- sim-verified on the pro max after native rebuild (~2.5 min, Build Succeeded):
  cold launch -> widget 2000 + empty ring (light AND dark); real scan+accept
  salad bowl ("Grilled chicken salad bowl with mixed vegetables, beans, eggs,
  and pasta" 620 cal / 42P / 48C / 27F) -> dashboard 1380 -> widget 1380 with
  ~31% coral arc (light AND dark, legible both); restart-app -> dashboard AND
  widget reset to 2000, empty ring, no stale value. two transient "Analysis
  failed" cards before success (provider flakiness again; direct curl to /scan
  returned 200 in 1.7s). tinted rendering NOT custom-handled or verified -
  DEVIATIONS.md #6.
- gotcha: the photo picker can open LATE - a first "Choose from library" tap
  that looks swallowed may still present the picker seconds later, so a blind
  re-tap at the same coords lands on the picker GRID (accidentally scanned the
  circuit board; its not_food card doubled as a live regression pass). after a
  seemingly dead tap, describe/await before tapping again.

## design identity (from spec)

warm off-white light bg / near-black dark bg; coral primary #E8654A-ish; raspberry
protein, amber carbs, blue-violet fat; system font, tabular numerals; rounded cards,
restrained borders; no glass effects. dashboard top-to-bottom: wordmark+Today, calorie
card (big remaining + ring), 3 macro bars, meals list/empty state, floating scan button.

## api cheat sheet

- widget: `createWidget('RemainingCaloriesWidget', Component)` with `'widget'` directive
  inside component; `Widget.updateSnapshot(props)`. name must match app.json exactly.
- agents sdk: `new Agent({ name, model, instructions })`; `run(agent, [{ role: 'user',
  content: [{ type: 'input_text', text }, { type: 'input_image', image: dataUrl }] }])`;
  `result.finalOutput` is string; `setTracingDisabled(true)`.
- image prep (task 7): expo-image-manipulator `ImageManipulator.manipulate(uri)` v57 api -
  verify exact api at docs.expo.dev/versions/v57.0.0/sdk/imagemanipulator/ before use.
  resize only if long edge > 1024, jpeg 0.82, base64 true.
