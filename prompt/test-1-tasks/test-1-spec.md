# spec: nourish - ai calorie tracker

(phase-1 spec of the spec-driven workflow. the contestant prompt
`../test-1-ai-calorie-tracker.md` is the functional ground truth. this spec turns it
into an implementable contract. if they disagree, the prompt wins.)

status: draft for human review

## objective

build **Nourish**, a production-quality ios calorie tracker in Expo. a user takes or
chooses one food photo, receives a real AI estimate for calories and macros, then
accepts it into today's dashboard.

the app is built for mobile developers comparing it side by side with other apps on
an iphone pro-class device. success means the complete happy path, failure paths,
animation, theme, and home-screen widget feel intentional and work without manual
repair.

the exact product scope is:

- one dashboard for today
- one camera and photo-library scan flow
- one AI result card with accept and discard
- explicit not-food, analysis, and network failures
- one small ios widget showing remaining calories

there is no onboarding, account, settings, date navigation, persistence, notification,
meal editing, manual meal entry, or history beyond the current in-memory day.

## ground truth and assumptions

ground truth, in priority order:

1. `../test-1-ai-calorie-tracker.md`, especially its functional and backend specs
2. the six images in `../screenshots-test-1/` for visual feel and transition intent
3. this spec for decisions the prompt leaves open

assumptions and judgment calls:

- the starter is an Expo SDK 57 TypeScript app with Expo Router, `@expo/ui`,
  `expo-widgets`, and `@openai/agents` already installed
- the app router lives in `app/`, so the required server route is exactly
  `app/scan+api.ts`
- the target daily goals are fixed constants: 2,000 kcal, 150 g protein, 250 g carbs,
  and 70 g fat
- Nourish uses warm coral as its accent, with charcoal text, warm neutral surfaces,
  and distinct semantic macro colors; system light and dark modes share the same
  hierarchy
- screenshot-only features such as tabs, streaks, a week strip, progress pages,
  settings, and background notifications are excluded because the written scope wins
- the widget snapshot is an operating-system rendering artifact, not app persistence;
  app state still resets on a cold launch and immediately resets the widget snapshot
- output nutrition values are AI estimates. the UI labels the result as an estimate
  and does not make health or medical claims

## tech stack

| concern | choice | reason |
|---|---|---|
| framework | Expo SDK 57, React Native, TypeScript strict, Expo Router | fixed starter and ios target |
| camera | `expo-camera` | full-screen in-app camera preview and capture |
| photo fallback | `expo-image-picker` | simulator-compatible photo-library input |
| image preparation | `expo-image-manipulator` | resize long edge to at most 1024 px and encode JPEG base64 |
| backend | Expo Router API route with server output | keeps the API key out of the client |
| AI | `@openai/agents`, model `gpt-5.6-luna` | fixed by the prompt |
| state | React context plus `useReducer` | enough for one in-memory day and an explicit state machine |
| animation | Reanimated plus `react-native-svg` | smooth ring, bar, card, and shared-photo transitions |
| widget | `expo-widgets` plus `@expo/ui` widget components | fixed by the prompt and starter |
| unit/integration tests | Jest Expo and React Native Testing Library | reducer, derived totals, route, and screen-state coverage |
| device verification | ios Simulator, iphone pro class | fixed judging environment |

primary API references to re-check during implementation:

- Expo Widgets: <https://docs.expo.dev/versions/latest/sdk/widgets/>
- Expo Router API routes: <https://docs.expo.dev/router/web/api-routes/>
- Expo ImageManipulator: <https://docs.expo.dev/versions/latest/sdk/imagemanipulator/>
- OpenAI Agents SDK agents: <https://openai.github.io/openai-agents-js/guides/agents/>
- OpenAI Agents SDK runs: <https://openai.github.io/openai-agents-js/guides/running-agents/>

## commands

run from the contestant app root:

```text
install:    bun install
add deps:   bunx expo install expo-camera expo-image-picker expo-image-manipulator react-native-reanimated react-native-svg
add tests:  bun add --dev jest-expo @testing-library/react-native @types/jest
ios build:  npx expo run:ios
dev:        bunx expo start --dev-client
test:       bun run test -- --runInBand
lint:       bun run lint
typecheck:  bunx tsc --noEmit
web export: bunx expo export --platform web --no-ssg
```

`npx expo run:ios` is preserved literally because the benchmark prompt requires that
exact command. all other JavaScript package and script work uses Bun.

## project structure

```text
<app root>/
  app/
    _layout.tsx                 # theme and day-state providers
    index.tsx                   # today's dashboard
    scan.tsx                    # full-screen modal scan state machine
    scan+api.ts                 # post /scan, server-only agents sdk call
  src/
    components/
      dashboard/               # calorie ring, macro bars, empty/list states
      scan/                    # camera, analyzing overlay, result, errors
    domain/
      nutrition.ts             # types, goals, validation, totals, remaining values
      scan-machine.ts          # pure reducer and legal transitions
    state/
      day-context.tsx          # in-memory meals and accept-once action
    services/
      prepare-image.ts         # resize, jpeg conversion, base64 encoding
      analyze-photo.ts         # typed client for post /scan
      widget.ts                # widget snapshot adapter
    theme/
      tokens.ts                # light/dark colors, type, spacing, motion
  widgets/
    RemainingCaloriesWidget.tsx
  tests/
    domain/                    # pure unit tests
    components/                # screen-state and interaction tests
    route/                     # scan route tests with mocked agents sdk
  verification/
    test-1/                    # final screenshots and concise verification log
  app.json
  DEVIATIONS.md                # only if implementation departs from this spec
```

## domain model and invariants

```ts
export type Nutrition = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type Meal = Nutrition & {
  id: string;
  food: string;
  confidence: number;
  thumbnailUri: string;
  loggedAt: number;
};

export const DAILY_GOALS = {
  calories: 2000,
  protein_g: 150,
  carbs_g: 250,
  fat_g: 70,
} as const;
```

invariants:

- meals exist only in memory and start empty on every cold app launch
- displayed totals are derived from meals, never maintained as separate mutable state
- all nutrition values must be finite, non-negative numbers before they reach the UI
- calories display as whole numbers; macro grams display to at most one decimal place
- remaining values can be negative, but visual progress is clamped to the range 0 to 1
- accepting one result appends exactly one meal; repeated taps and stale responses
  cannot append duplicates
- discarding a result never changes dashboard totals or the widget
- one analysis may be active at a time; a request id prevents a late response from a
  discarded or replaced photo from changing the current screen
- the accepted meal retains the prepared local image URI as its thumbnail for the life
  of the app process
- the result `confidence` is validated and stored but not promoted as false precision
  in the main UI

## backend contract

enable the required server bundle in `app.json`:

```json
{
  "expo": {
    "web": {
      "output": "server"
    },
    "plugins": [
      [
        "expo-widgets",
        {
          "widgets": [
            {
              "name": "RemainingCaloriesWidget",
              "displayName": "Nourish",
              "description": "Shows today's remaining calories.",
              "supportedFamilies": ["systemSmall"]
            }
          ]
        }
      ]
    ]
  }
}
```

### request

`POST /scan` with `Content-Type: application/json`:

```ts
type ScanRequest = {
  image: string; // raw base64 for a jpeg, with no data-url prefix
};
```

before the request, the client preserves aspect ratio, resizes only when the long edge
exceeds 1024 px, exports JPEG at 0.82 quality, and obtains base64 from that exact
prepared file. the route rejects a missing, empty, malformed, or unreasonably large
body with status 400 and does not call the model.

### agent configuration

`app/scan+api.ts` creates an `Agent` with exactly:

- model: `gpt-5.6-luna`
- name: `MacroLens`
- instructions:

```text
You identify food from a single photo. Respond with strict JSON only, no prose: {"food": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "confidence": number between 0 and 1}. If the image does not contain food, respond {"error": "not_food"}.
```

the run input contains one user message with one short text part and one JPEG image
part. the image is represented as a `data:image/jpeg;base64,...` URL only inside the
server route. the run disables SDK tracing so the food photo is not copied into trace
records. the route parses and validates the final output before returning it.

### response

successful food analysis returns status 200:

```ts
type ScanSuccess = {
  food: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
};
```

a valid non-food result returns status 200:

```ts
type ScanNotFood = { error: 'not_food' };
```

invalid requests return status 400 with `{ "error": "invalid_request" }`. provider,
timeout, malformed model output, or internal failures return status 502 with
`{ "error": "analysis_failed" }`. no error response includes a stack, API key,
provider payload, image data, or model output.

`OPENAI_API_KEY` is read only inside `app/scan+api.ts` or modules imported only by that
route. server code is never imported by a client module. the key and image base64 are
never logged. there is no database, auth, second endpoint, or server-side image store.

## interaction state machine

legal scan states:

```text
idle dashboard
  -> acquiring camera or library
  -> preparing image
  -> analyzing prepared photo
  -> result over prepared photo
  -> accepting -> dashboard

analyzing
  -> not-food error over photo
  -> recoverable analysis error over photo
  -> network error over photo

result or error
  -> discard -> dashboard
not-food error
  -> try another photo -> acquiring
analysis or network error
  -> retry analysis -> analyzing the same prepared photo
```

behavior rules:

1. tapping the prominent scan button opens `scan.tsx` as a full-screen modal.
2. the scan screen requests camera permission only when camera is chosen. denied
   permission leaves the photo-library action available and shows a clear explanation.
3. camera capture immediately freezes the captured image in the same visual frame.
   preparation and analysis overlays animate above that image, so the photo never
   flashes away or gets replaced by a blank screen.
4. library selection enters the same prepared-photo pipeline as camera capture.
   cancellation returns to acquisition without an error.
5. analyzing shows an indeterminate, honest loading treatment. it does not display a
   fabricated percentage because the backend provides no progress signal.
6. success reveals a bottom card over the same photo with the food name, estimated
   calories, protein, carbs, fat, and clear accept/discard actions.
7. accept is disabled after its first press. the modal closes only after the meal is
   added and the widget snapshot request has been issued.
8. the dashboard animates from the previous totals to the new derived totals. the meal
   row enters without moving the floating scan action out of reach.
9. not-food uses "Try another photo" and "Discard". transport or analysis failures use
   "Retry analysis" and "Discard". every error is readable over the image in both
   themes and remains usable with VoiceOver.

## visual and motion specification

the screenshots establish the desired hierarchy: quiet background, oversized remaining
calories, strong progress visualization, compact macro summaries, image-led meal rows,
full-screen capture, and a result card layered over the captured photo.

Nourish's own identity:

- warm off-white light background and near-black dark background
- coral primary accent, raspberry protein, amber carbs, and blue-violet fat
- native system font with large tabular numerals for nutrition values
- rounded cards with restrained borders and shadows; no glass effects that reduce
  contrast
- system status bar, safe areas, native permission sheets, and haptics on capture and
  accept

dashboard layout, top to bottom:

1. compact Nourish wordmark and "Today" label
2. large calorie card with remaining number and animated circular ring
3. three macro bars with consumed and remaining labels
4. meal section with a designed empty state or a vertical list of meal rows
5. floating scan button pinned above the bottom safe area

motion requirements:

- capture-to-analyzing uses the same image instance or an exact shared-frame handoff;
  there is no white frame, geometry jump, or image aspect-ratio change
- card and error overlays use one short spring or fade/translate transition, not a
  sequence of decorative delays
- calorie ring and macro bars animate from their previous values after accept and land
  together in about 450 to 650 ms
- reduce-motion users receive opacity changes and immediate numeric updates instead of
  large transforms
- all taps remain responsive during animation, except the deliberately locked accept
  action

widget layout:

- small system widget only
- Nourish mark, large remaining-calorie number, "calories left", and a compact ring
- semantic light/dark widget colors with legible system margins
- no macros, buttons, history, or configuration
- define the widget with `createWidget('RemainingCaloriesWidget', component)` and the
  component-level `'widget'` directive; its name must match the app config exactly
- call `updateSnapshot` on initial app state and after every accepted meal

## code style

```ts
// totals are derived from the meal list, never synchronized by effects
export function getDaySummary(meals: readonly Meal[]): DaySummary {
  const consumed = meals.reduce(addNutrition, EMPTY_NUTRITION);

  return {
    consumed,
    remaining: subtractNutrition(DAILY_GOALS, consumed),
  };
}
```

- TypeScript strict mode with no `any` at domain or API boundaries
- lowercase comments, descriptive names, small pure functions, and named state events
- UI components receive typed values and callbacks; they do not fetch, parse AI output,
  or mutate global state
- domain files do not import React Native, Expo, or widget modules
- normalize and validate external data once at the boundary
- use semantic theme tokens instead of raw colors inside components
- use hyphens or colons, never em dashes

## testing strategy

### automated tests

domain tests cover:

- totals and remaining values for zero, one, and at least three meals
- decimal macros, values above goals, rounding, and progress clamping
- legal and illegal scan-machine transitions
- accept-once behavior and stale request rejection
- response validation for valid food, not-food, negative values, NaN-like data, and
  malformed output

component tests cover:

- empty and populated dashboards
- camera-denied fallback to the library
- analyzing, result, not-food, analysis-failure, and network-failure states
- retry semantics for each failure type
- accept and discard effects
- accessible names, roles, and minimum interaction targets for primary controls

route tests call the exported `POST` handler with the Agents SDK mocked and prove:

- malformed requests are rejected before the model call
- the exact agent name, model, and instructions are used
- the model receives a JPEG image input
- success and not-food outputs round-trip unchanged after validation
- malformed model output and provider rejection become safe 502 responses
- neither client imports nor logs expose `OPENAI_API_KEY`

### end-to-end device verification

use the fixed iphone pro-class ios Simulator and add the same three judging assets to
Photos: one clean single dish, one mixed plate, and one non-food object.

run these user-level scenarios:

1. cold launch: empty dashboard and default widget snapshot
2. library food scan: real `/scan` request, same-photo analyzing transition, result,
   accept, dashboard animation, and widget update
3. two more accepted food scans: totals match the arithmetic across 3 meals
4. non-food scan: readable error, try another photo, then successful scan
5. network failure: disable connectivity during analysis, see the error, restore it,
   retry the same image successfully
6. discard: neither dashboard totals nor widget changes
7. camera permission: camera path on a capable device or simulator path if supported;
   denied-camera state still offers the library
8. switch system appearance live and repeat dashboard/result checks in light and dark
9. add the widget to the simulator home screen and visually verify its updated snapshot

capture evidence in `verification/test-1/`:

```text
01-dashboard-empty-light.png
02-analyzing-photo-carry-through.png
03-result-card-light.png
04-dashboard-three-meals.png
05-not-food-error.png
06-network-error.png
07-dashboard-dark.png
08-result-card-dark.png
09-widget-before.png
10-widget-after.png
verification.md
```

`verification.md` records the simulator model and ios version, commands run, three
meal inputs and returned nutrition, expected versus displayed totals, failure checks,
and links to every screenshot. a short screen recording is the required evidence for
the shared-photo transition and animated dashboard update because still images cannot
prove motion quality.

## boundaries

- **always:** follow the prompt's exact backend configuration; keep the key server-side;
  validate every external boundary; support camera and library; use real AI for final
  end-to-end verification; update the widget after accept; test both themes; run test,
  lint, and typecheck before each implementation commit; record judgment calls
- **ask first:** none during the autonomous benchmark; if a required package or API is
  unavailable, make the smallest compliant fallback and record it in `DEVIATIONS.md`
- **never:** add features outside the prompt; persist meals; fake AI results in final
  evidence; show fabricated analysis progress; log secrets or image payloads; import
  server modules into the client; copy or vendor an existing app or template; weaken or
  delete a failing test to finish

## success criteria

- [ ] `npx expo run:ios` builds and launches the app cleanly on the target simulator
- [ ] `bun run test -- --runInBand`, `bun run lint`, and `bunx tsc --noEmit` pass
- [ ] web server export succeeds with `web.output` set to `server`
- [ ] a library food photo reaches the real MacroLens route and returns a validated
      food result
- [ ] every uploaded JPEG has a long edge no greater than 1024 px
- [ ] camera capture and library selection use the same scan pipeline
- [ ] the captured or selected photo remains visually continuous through analysis and
      result, proven by a screen recording
- [ ] accepting logs exactly one meal and animates the dashboard from prior totals
- [ ] displayed totals are arithmetically correct after at least three meals
- [ ] discard changes neither the day state nor widget snapshot
- [ ] a non-food image shows the correct recovery actions and retry succeeds
- [ ] a network failure shows the correct recovery actions and same-image retry succeeds
- [ ] the small home-screen widget is visible and updates after an accepted meal
- [ ] dashboard, result, errors, and widget are verified in light and dark modes
- [ ] API key and image base64 are absent from client code, client logs, and committed
      artifacts
- [ ] all required evidence exists under `verification/test-1/`
- [ ] implementation contains no feature outside the stated scope

## open questions

none are blocking because the benchmark requires autonomous decisions. the human review
gate is whether the assumptions, Nourish identity, fixed daily goals, request shape, and
verification thresholds above accurately express the intended test. after approval,
the next phase is a technical plan in `prompt/test-1-tasks/plan.md`.
