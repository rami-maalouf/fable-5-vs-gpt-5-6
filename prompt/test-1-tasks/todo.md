# todo: nourish - ai calorie tracker

this checklist implements `plan.md`; `test-1-spec.md` is normative. each task is one
focused session and one lowercase conventional commit. start each behavior task with a
failing test. do not begin implementation until this plan is approved.

## phase 1: baseline and high-risk proofs

### task 1: audit starter and establish the build baseline

**description:** inspect the provided app before changing it. confirm Expo SDK and
package versions, actual router root, existing widget plugin, scripts, TypeScript mode,
Metro config, ignored `.env`, and simulator target. install only the dependencies and
test tooling named by the approved spec. configure server output and the widget entry
without building product screens.

**acceptance criteria:**

- [x] the recorded audit matches the real starter, and any difference from the spec is
      resolved in favor of the prompt or documented in `DEVIATIONS.md`
- [x] app config has server output and one `RemainingCaloriesWidget` supporting only
      `systemSmall`; `.env` remains ignored and untracked
- [x] the untouched shell builds and launches with no lint, type, or test regression

**verification:**

- [x] `bun install`
- [x] `bun run test -- --runInBand`, `bun run lint`, and `bunx tsc --noEmit`
- [x] `npx expo run:ios` launches on the fixed iphone pro-class simulator

**dependencies:** none

**files likely touched:** `package.json`, `bun.lock`, `app.json`, `jest.config.*`,
`DEVIATIONS.md` only if required

**estimated scope:** medium, 3 to 5 files

**commit:** `chore: establish nourish app baseline`

### task 2: prove the real MacroLens API route

**description:** implement the smallest complete server slice in `app/scan+api.ts`.
validate `{ image }`, construct the exact MacroLens agent, send one jpeg image part,
disable tracing, parse and validate final JSON, and map invalid request or analysis
failures to safe responses. test the handler with the Agents SDK mocked, then use a
temporary debug action in the starter screen to call the running Expo server with one
known food image and the real key. remove that debug action in task 6.

**acceptance criteria:**

- [x] route tests prove the exact name, model, verbatim instructions, image input, 200
      success/not-food responses, 400 validation, and safe 502 behavior
- [x] a real food JPEG sent through the simulator or a route client returns validated
      nutrition from `gpt-5.6-luna`
- [x] the key, image base64, provider payload, and raw model output never appear in
      client code or logs

**verification:**

- [x] `bun run test -- --runInBand tests/route`
- [x] `bunx expo export --platform web --no-ssg`
- [x] manual real-key request through the running Expo route, with safe result fields
      recorded and no payload contents logged

**dependencies:** task 1

**files likely touched:** `app/scan+api.ts`, `tests/route/scan-api.test.ts`,
`src/domain/scan-contract.ts`, `app/index.tsx`, `DEVIATIONS.md` only if required

**estimated scope:** medium, 4 to 5 files

**commit:** `feat: add macrolens scan route`

### task 3: prove the real home-screen widget target

**description:** create the minimal `RemainingCaloriesWidget` using `createWidget` and
the component-level `'widget'` directive. render a static remaining-calorie value, call
`updateSnapshot`, rebuild the native target, add it from the simulator widget gallery,
and confirm the configured name matches the factory exactly.

**acceptance criteria:**

- [x] the development build contains one Nourish small widget and it is selectable from
      the simulator home-screen gallery
- [x] the widget renders a known static value using `@expo/ui` without Expo Go or native
      Swift code
- [x] changing the known value and calling `updateSnapshot` refreshes the home-screen
      widget

**verification:**

- [x] `npx expo run:ios` completes after widget configuration
- [x] manual gallery add and snapshot update on the simulator home screen
- [x] capture temporary checkpoint evidence without adding it to final verification

**dependencies:** task 1

**files likely touched:** `widgets/RemainingCaloriesWidget.tsx`, `src/services/widget.ts`,
`app/_layout.tsx`, `app.json`

**estimated scope:** medium, 4 files

**commit:** `feat: prove nourish widget target`

### checkpoint 1: required runtimes proven

- [x] app launches cleanly
- [x] focused and full tests pass
- [x] real MacroLens food response succeeds
- [x] widget is visible and refreshes on the simulator home screen
- [x] no implementation fallback violates the prompt

## phase 2: deterministic product foundation

### task 4: build nutrition rules and the scan state machine

**description:** test-drive the pure nutrition functions and scan reducer. define goals,
meal and response types, output validation, derived totals, remaining values, display
rounding, progress clamping, legal events, accept-once behavior, and request-id handling
for late responses.

**acceptance criteria:**

- [x] zero, one, and three-meal totals are exact, including decimals and over-goal
      negative remaining values with clamped visual progress
- [x] malformed, negative, non-finite, and out-of-range response data is rejected
- [x] reducer tests cover every legal state, retry path, discard, duplicate accept, and
      stale or out-of-order response

**verification:**

- [x] `bun run test -- --runInBand tests/domain`
- [x] `bunx tsc --noEmit`

**dependencies:** task 1

**files likely touched:** `src/domain/nutrition.ts`, `src/domain/scan-machine.ts`,
`tests/domain/nutrition.test.ts`, `tests/domain/scan-machine.test.ts`

**estimated scope:** medium, 4 files

**commit:** `test: define nutrition and scan behavior`

### task 5: create in-memory day state and widget synchronization

**description:** implement the day provider around meal-only reducer state. expose
derived summary selectors and an idempotent accept action. connect the widget adapter so
cold launch publishes default calories and accepted meals publish the new remaining
value without treating the widget snapshot as persistence.

**acceptance criteria:**

- [x] cold provider state is empty and derives the exact fixed goals
- [x] accepting a unique result adds one meal; duplicate acceptance and discard do not
      change state
- [x] default and accepted summaries call the widget adapter with the same remaining
      calorie value shown by selectors

**verification:**

- [x] focused provider tests with the widget adapter mocked
- [x] manual cold launch resets the widget snapshot to 2,000 calories remaining

**dependencies:** tasks 3 and 4

**files likely touched:** `src/state/day-context.tsx`, `src/services/widget.ts`,
`app/_layout.tsx`, `tests/components/day-context.test.tsx`

**estimated scope:** medium, 4 files

**commit:** `feat: add in-memory day state`

### task 6: deliver the dashboard vertical slice

**description:** build the Nourish dashboard from semantic tokens: header, large
calorie summary, macro bars, designed empty state, populated meal rows, and fixed scan
action above the safe area. render from day selectors only. use deterministic fixture
state in tests to prove the populated layout and arithmetic without adding a product
feature for mock meals.

**acceptance criteria:**

- [x] empty state, zero-progress rings/bars, goals, and scan action render correctly on
      an iphone pro-class screen
- [x] three fixture meals render correct thumbnails, labels, calories, macros, totals,
      remaining values, and over-goal treatment
- [x] primary controls have accessible names and at least 44-point interaction targets

**verification:**

- [x] focused dashboard component tests
- [x] manual empty and fixture-populated simulator review in light mode

**dependencies:** task 5

**files likely touched:** `app/index.tsx`,
`src/components/dashboard/NutritionSummary.tsx`,
`src/components/dashboard/MealList.tsx`, `src/theme/tokens.ts`,
`tests/components/dashboard.test.tsx`

**estimated scope:** medium, 5 files

**commit:** `feat: build nourish dashboard`

### checkpoint 2: deterministic state and dashboard complete

- [x] domain and component tests pass
- [x] empty and populated layouts are visually intentional
- [x] three-meal fixture arithmetic matches the displayed values
- [x] default and fixture widget snapshots match day selectors

## phase 3: complete food scan path

### task 7: add library acquisition and jpeg preparation

**description:** open `scan.tsx` as a full-screen modal from the dashboard. provide
camera and Photos choices, with Photos implemented first. after selection, preserve
aspect ratio, resize only when the long edge exceeds 1024 px, export jpeg at 0.82,
return local URI plus raw base64, and enter the analyzing state over that exact URI.

**acceptance criteria:**

- [x] Photos cancellation returns to acquisition without an error
- [x] portrait, landscape, small, and large image tests preserve aspect ratio and never
      produce a long edge above 1024 px
- [x] selected photo remains visible while preparation changes to analysis

**verification:**

- [x] focused image-preparation tests with Expo APIs mocked
- [x] manual selection from simulator Photos using a real judging image

**dependencies:** tasks 4 and 6

**files likely touched:** `app/scan.tsx`, `app/_layout.tsx`,
`src/services/prepare-image.ts`, `src/components/scan/AcquisitionView.tsx`,
`tests/domain/prepare-image.test.ts`

**estimated scope:** medium, 5 files

**commit:** `feat: add photo library scan input`

### task 8: connect real analysis and render the result

**description:** add a typed client for `POST /scan`, start one request per prepared
photo, and feed the response into the scan reducer. render an honest indeterminate
analyzing overlay and a result card above the still-mounted photo with estimated food,
calories, macros, accept, and discard.

**acceptance criteria:**

- [x] one library photo reaches the real route and displays its validated result without
      mocked product data
- [x] the result card shows every required field, clearly labels the estimate, and keeps
      accept/discard reachable above the safe area
- [x] the photo URI and crop remain identical from analyzing through result

**verification:**

- [x] focused client and result-state component tests
- [x] manual clean-dish and mixed-plate analysis through the real backend

**dependencies:** tasks 2 and 7

**files likely touched:** `src/services/analyze-photo.ts`, `app/scan.tsx`,
`src/components/scan/AnalyzingOverlay.tsx`, `src/components/scan/ResultCard.tsx`,
`tests/components/scan-result.test.tsx`

**estimated scope:** medium, 5 files

**commit:** `feat: show real food analysis result`

### task 9: complete accept and discard end to end

**description:** connect result actions to day state. accept locks immediately, creates
one meal with the prepared thumbnail, updates the widget snapshot, closes the modal,
and reveals the populated dashboard. discard closes without changing day or widget.

**acceptance criteria:**

- [x] repeated accept taps can log only one meal and the row retains the prepared photo
- [x] dashboard calories and macros equal the accepted result and the widget receives
      the identical remaining-calorie value
- [x] discard from result leaves meals, totals, and widget unchanged

**verification:**

- [x] focused integration tests for accept-once and discard
- [x] manual real-photo accept, home-screen widget check, then a separate discard check

**dependencies:** tasks 5 and 8

**files likely touched:** `app/scan.tsx`, `src/state/day-context.tsx`, `app/index.tsx`,
`tests/components/scan-accept.test.tsx`

**estimated scope:** medium, 4 files

**commit:** `feat: log accepted food analysis`

### checkpoint 3: primary judging path complete

- [x] real library food scan reaches the real backend
- [x] prepared photo carries through analysis and result
- [x] accept logs exactly one meal and updates dashboard plus widget
- [x] discard has no observable side effect

## phase 4: camera parity and resilience

### task 10: add full-screen camera acquisition

**description:** implement the camera choice with `expo-camera`, rear camera preview,
permission request on demand, capture haptic, shutter and close controls, and a denied
permission explanation that retains the Photos action. send captured URIs into the
existing preparation pipeline with no camera-specific analysis branch.

**acceptance criteria:**

- [x] granted camera shows a safe-area-correct full-screen preview and one capture logs
      no more than one photo
- [x] denied or unavailable camera remains recoverable through Photos or close
- [x] captured and selected images dispatch the same preparation event and use the same
      analysis, result, error, and accept logic

**verification:**

- [x] component tests for granted, denied, and unavailable permission states
- [x] simulator camera UI review; capture verification on a capable simulator or device
      when available

**dependencies:** task 9

**files likely touched:** `src/components/scan/CameraView.tsx`, `app/scan.tsx`,
`src/components/scan/AcquisitionView.tsx`, `tests/components/camera.test.tsx`

**estimated scope:** medium, 4 files

**commit:** `feat: add camera scan input`

### task 11: harden failures, retries, and cancellation

**description:** render distinct not-food and recoverable analysis/network failures over
the prepared photo. not-food retries through acquisition; network and analysis retry
the same image. cancel active work on discard or unmount, and ignore late results using
the request id already defined by the reducer.

**acceptance criteria:**

- [x] non-food shows "Try another photo" and succeeds after a new food selection
- [x] network or safe 502 error shows "Retry analysis" and succeeds with the same image
      after recovery
- [x] discard, unmount, rapid retry, and out-of-order completion never log or display a
      stale result

**verification:**

- [x] focused state and component tests for every error and race path
- [x] manual non-food judging image and offline-then-retry scenarios

**dependencies:** tasks 9 and 10

**files likely touched:** `src/components/scan/ErrorCard.tsx`, `app/scan.tsx`,
`src/services/analyze-photo.ts`, `tests/components/scan-errors.test.tsx`

**estimated scope:** medium, 4 files

**commit:** `fix: harden scan recovery paths`

### checkpoint 4: acquisition and resilience complete

- [x] library and camera share one pipeline
- [x] denied camera has a complete fallback
- [x] not-food and network recovery scenarios pass end to end
- [x] races and cancellation cannot mutate day state

## phase 5: native-feel hardening

### task 12: perfect photo continuity and nutrition motion

**description:** keep one prepared-image layer mounted across preparation, analysis,
result, and errors. add restrained overlay transitions. animate calorie ring, macro
bars, values, and meal-row entrance from the previous summary after accept, while
honoring the 450 to 650 ms target and leaving controls responsive.

**acceptance criteria:**

- [x] normal-speed and slow-animation recordings show no blank frame, crop change, or
      geometry jump between prepared photo, analysis, result, and error
- [x] dashboard ring and bars animate from prior to new values and land together within
      the specified window after each accepted meal
- [x] three rapid sequential accepted meals settle on exact derived totals without
      visual or state drift

**verification:**

- [x] focused animation-state tests where practical
- [x] screen recording at normal speed and with simulator slow animations enabled
- [x] simulator performance overlay shows no obvious dropped-frame sequence

**dependencies:** task 11

**files likely touched:** `app/scan.tsx`, `src/components/scan/PhotoStage.tsx`,
`src/components/dashboard/NutritionSummary.tsx`,
`src/components/dashboard/MealList.tsx`

**estimated scope:** medium, 4 files

**commit:** `style: polish scan and nutrition motion`

### task 13: audit themes, accessibility, and native behavior

**description:** finalize semantic tokens and live system appearance. audit status bar,
safe areas, dynamic type at practical sizes, VoiceOver labels and order, contrast,
44-point targets, reduced motion, haptics, loading announcements, and readable errors.
fix every visible defect found in both themes without adding features.

**acceptance criteria:**

- [x] dashboard, acquisition, analysis, result, all errors, and meal list remain legible
      and intentional in live-switched light and dark modes
- [x] primary flow is operable with VoiceOver labels and reduced motion, with no clipped
      content at the tested larger text size
- [x] status bar, safe areas, keyboard-free layout, permission sheets, and haptics feel
      native on the target simulator

**verification:**

- [x] focused accessibility assertions in component tests
- [x] manual light/dark, VoiceOver, larger text, and reduce-motion sweep

**dependencies:** task 12

**files likely touched:** `src/theme/tokens.ts`, `app/_layout.tsx`, `app/index.tsx`,
`app/scan.tsx`, `tests/components/accessibility.test.tsx`

**estimated scope:** medium, 5 files

**commit:** `style: complete nourish accessibility audit`

### task 14: finish widget design and snapshot consistency

**description:** replace the spike content with the final small widget: Nourish mark,
large remaining-calorie number, label, and compact ring. adapt to widget light, dark,
and tinted rendering as supported. audit cold launch plus each accepted meal against
the app's derived value.

**acceptance criteria:**

- [x] only the small family is offered, and its content remains legible within system
      margins in light, dark, and available tinted rendering
- [x] cold launch resets to 2,000 and each accepted meal updates the widget to the exact
      dashboard remaining-calorie value
- [x] widget contains no macros, controls, history, configuration, or stale prior-run
      value after app relaunch

**verification:**

- [x] focused adapter tests for initial and sequential accepted values
- [x] simulator home-screen before/after visual checks in light and dark modes

**dependencies:** task 12

**files likely touched:** `widgets/RemainingCaloriesWidget.tsx`, `src/services/widget.ts`,
`src/state/day-context.tsx`, `tests/components/widget-sync.test.tsx`

**estimated scope:** medium, 4 files

**commit:** `style: finish nourish calorie widget`

### checkpoint 5: production-quality interaction complete

- [x] photo continuity and dashboard motion recordings pass visual review
- [x] light, dark, accessibility, and reduced-motion sweeps pass
- [x] final widget matches dashboard values before and after meal logging
- [x] full automated suite, lint, typecheck, and server export pass

## phase 6: verification and handoff

### task 15: capture happy-path and motion evidence

**description:** use the fixed clean dish and mixed plate on the fixed iphone pro-class
simulator. capture the final empty dashboard, same-photo analysis, result card, and
three-meal dashboard. record the complete library scan and accept transition at normal
speed, including exact returned and displayed arithmetic. fix any happy-path defect
before keeping the evidence.

**acceptance criteria:**

- [x] final files `01-dashboard-empty-light.png` through
      `04-dashboard-three-meals.png` match the spec and current app
- [x] one short recording proves photo continuity, result, accept, and synchronized
      dashboard motion without blank frames or duplicate logging
- [x] the three-meal displayed totals equal the recorded real responses exactly

**verification:**

- [x] replay the recording frame by frame around capture, analysis, result, and accept
- [x] independently recalculate the three-meal calorie and macro totals

**dependencies:** tasks 13 and 14

**files likely touched:** `verification/test-1/01-dashboard-empty-light.png`,
`verification/test-1/02-analyzing-photo-carry-through.png`,
`verification/test-1/03-result-card-light.png`,
`verification/test-1/04-dashboard-three-meals.png`,
`verification/test-1/happy-path.mov`

**estimated scope:** medium, 5 evidence files

**commit:** `test: capture nourish happy path`

### task 16: capture resilience and theme evidence

**description:** run the fixed non-food input, offline retry, and live appearance switch
on the final build. capture both failure surfaces plus the final dark dashboard and dark
result card. verify retry semantics, discard isolation, camera fallback, accessibility,
and reduced motion while these states are active.

**acceptance criteria:**

- [x] final `05-not-food-error.png` and `06-network-error.png` show the correct distinct
      recovery actions and readable prepared-photo context
- [x] final `07-dashboard-dark.png` and `08-result-card-dark.png` have no clipping,
      contrast, safe-area, status-bar, or default-surface defect
- [x] non-food new-photo retry and offline same-photo retry both succeed; discard and
      stale completions change no state

**verification:**

- [x] manual non-food, offline retry, discard, denied-camera fallback, VoiceOver, larger
      text, and reduce-motion sweep
- [x] focused automated suite remains green after any fixes

**dependencies:** task 15

**files likely touched:** `verification/test-1/05-not-food-error.png`,
`verification/test-1/06-network-error.png`,
`verification/test-1/07-dashboard-dark.png`,
`verification/test-1/08-result-card-dark.png`

**estimated scope:** medium, 4 evidence files

**commit:** `test: capture nourish resilience evidence`

### task 17: capture widget evidence and complete the final audit

**description:** capture the small widget before and after an accepted meal, then run
the complete automated, build, export, secret, and scope checks. write
`verification.md` with simulator details, commands, input results, arithmetic,
criterion-to-evidence links, judgment calls, deviations, and the prompt's final short
summary.

**acceptance criteria:**

- [x] `09-widget-before.png` and `10-widget-after.png` show the exact matching dashboard
      values and no stale prior-run state
- [x] every spec criterion links to direct evidence or an honest incomplete explanation;
      the final summary does not overclaim
- [x] full tests, lint, typecheck, server export, clean ios launch, secret scan, and
      out-of-scope feature scan pass from the final tree

**verification:**

- [x] `bun run test -- --runInBand`
- [x] `bun run lint` and `bunx tsc --noEmit`
- [x] `bunx expo export --platform web --no-ssg` and `npx expo run:ios`
- [x] independent walkthrough of `verification/test-1/verification.md`

**dependencies:** task 16

**files likely touched:** `verification/test-1/09-widget-before.png`,
`verification/test-1/10-widget-after.png`, `verification/test-1/verification.md`,
`DEVIATIONS.md` only if needed

**estimated scope:** medium, 3 to 4 files

**commit:** `test: verify nourish definition of done`

### final checkpoint: ready for benchmark judging

- [x] all 17 tasks and 5 checkpoints are complete
- [x] all prompt and spec criteria have evidence
- [x] working tree contains no secrets or unintended generated files
- [x] implementation is ready for Rami's independent judging script
