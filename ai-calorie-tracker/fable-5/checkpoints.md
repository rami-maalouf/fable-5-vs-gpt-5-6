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

### next: task 9 (accept end to end), then 10-17

connect accept to day state: lock accept, create one meal with the prepared
thumbnail, update widget snapshot, close modal, dashboard animates. checkpoint-2
leftover: widget-snapshot-vs-selector fixture box still open until task 9 logs
real meals.

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
