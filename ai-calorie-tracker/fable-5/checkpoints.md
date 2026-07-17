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

### next: task 6 (dashboard vertical slice), then tasks 7-17

after widget proof: tick checkpoint-1 boxes in todo.md, then task 6 (dashboard vertical
slice: replace starter tabs/screens with Nourish dashboard - delete app-tabs, explore,
welcome starter components; build src/theme/tokens.ts semantic tokens light+dark, warm
coral accent; NutritionSummary ring via react-native-svg + reanimated; MealList;
empty state; Scan meal floating button), task 7+ per todo.md.

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
