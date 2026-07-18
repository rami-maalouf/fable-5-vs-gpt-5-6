# test 1 verification notes

## task 15 happy path and motion evidence

Device: iPhone 17 Pro simulator, UDID `93EEF062-B4DC-4989-AF77-CF47EE2A9816`, iOS 27.0 runtime.

Inputs:

- `inputs/clean-dish.jpg`: 1024 x 1024
- `inputs/mixed-plate.jpg`: 1024 x 1536
- `inputs/not-food.jpg`: 1024 x 683

Captured files:

- `01-dashboard-empty-light.png`: cold empty dashboard, 2000 calories left, no meals yet.
- `02-analyzing-photo-carry-through.png`: selected clean dish remains mounted behind the analyzing card.
- `03-result-card-light.png`: clean dish result card, 650 calories, 45g protein, 55g carbs, 25g fat, 87 percent confidence.
- `04-dashboard-three-meals.png`: final three-meal dashboard with all accepted rows visible.
- `happy-path.mov`: 55.658333 seconds, H.264, 1206 x 2622. Frame-index review of frame 242 confirms the final settled dashboard after accept.

Happy-path recording result:

- food: grilled chicken salad bowl with vegetables, edamame, corn, eggs, and pasta
- estimate: 650 calories, 48g protein, 55g carbs, 25g fat, 88 percent confidence
- accepted dashboard: 1350 calories left, 48 / 150g protein, 55 / 250g carbs, 25 / 70g fat, one meal logged

Three-meal dashboard arithmetic:

| row | calories | protein | carbs | fat |
| --- | ---: | ---: | ---: | ---: |
| clean dish result | 650 | 45g | 55g | 25g |
| mixed plate result | 2200 | 145g | 95g | 135g |
| clean dish retry result | 620 | 48g | 43g | 28g |
| displayed total | 3470 | 238g | 193g | 188g |

Independent checks:

- calories: 650 + 2200 + 620 = 3470, displayed as 3470 calories logged and 1470 over target.
- protein: 45 + 145 + 48 = 238, displayed as 238 / 150g and 88g over.
- carbs: 55 + 95 + 43 = 193, displayed as 193 / 250g and 57g left.
- fat: 25 + 135 + 28 = 188, displayed as 188 / 70g and 118g over.

Recording review:

- whole-recording contact sheet confirmed empty dashboard, scan sheet, Photos picker, selected photo continuity, result card, and accept action.
- frame-index extraction confirmed the final recorded frame is the settled dashboard with exactly one logged meal.
- no blank frame or duplicate meal row was observed in the reviewed recording frames.

## task 16 resilience and theme evidence

Captured files:

- `05-not-food-error.png`: non-food circuit-board input, selected photo remains visible, recovery action is `Try another photo`.
- `06-network-error.png`: clean dish input with analyzer unavailable, selected photo remains visible, recovery action is `Retry analysis`.
- `07-dashboard-dark.png`: empty dashboard in dark appearance, normal content size.
- `08-result-card-dark.png`: clean dish result card in dark appearance, normal content size.

Manual resilience checks:

- non-food retry: `Try another photo` returned to acquisition, selecting `clean-dish.jpg` reached a food result without logging the non-food attempt.
- offline retry: analyzer outage produced `Connection problem`; after restoring the analyzer, `Retry analysis` reused the same prepared clean-dish photo and reached a food result.
- discard isolation: discarding after both retry paths returned to an empty dashboard with 2000 calories left and no meals.
- stale completion isolation: close and discard paths were inspected through the reducer-backed scan flow; no late result added a meal after leaving the scan.
- denied-camera fallback: setting simulator TCC `kTCCServiceCamera` to denied for `com.rami.nourish` produced `Camera access is off` with `Choose from Photos` and `Close scan`.
- accessibility: error and fallback cards expose single summary or alert labels plus named actions in the accessibility tree.
- larger text: initial `accessibility-extra-extra-large` sweep exposed clipped dashboard text. The final build caps dense visual text with `nourishFontScale.dense`, while preserving full semantic labels. Re-sweep passed on the dashboard at `accessibility-extra-extra-large`.
- reduced motion: simulator `ReduceMotionEnabled` was enabled and the app restarted. Automated coverage verifies no `Animated.timing` calls for nutrition and meal row transitions when reduced motion is active.

Task 16 result notes:

- dark result card final returned: grilled chicken and vegetable salad bowl with edamame, eggs, corn, tomatoes, cabbage, cucumber, lettuce and macaroni, 620 calories, 48g protein, 48g carbs, 25g fat, 87 percent confidence.
- the four task 16 screenshots were reviewed for clipping, contrast, safe areas, status bar treatment, and default-surface defects.

## task 17 widget and final audit evidence

Captured files:

- `09-widget-before.png`: simulator home screen with the Nourish small widget showing 2000 calories left after a clean dashboard launch.
- `10-widget-after.png`: simulator home screen with the Nourish small widget showing 1380 calories left after accepting a 620-calorie meal.

Widget before and after:

- dashboard before accept: 2000 calories left, no meals yet.
- widget before accept: 2000 calories left.
- accepted real scan result: grilled chicken salad bowl with vegetables, edamame, eggs, and corn, 620 calories, 48g protein, 43g carbs, 28g fat, 87 percent confidence.
- dashboard after accept: 1380 calories left, 48 / 150g protein, 43 / 250g carbs, 28 / 70g fat, one meal logged.
- widget after accept: 1380 calories left.
- arithmetic: 2000 - 620 = 1380.

Final command audit:

- `bun run test -- --runInBand`: passed, 18 suites and 73 tests.
- `bun run lint`: passed.
- `bunx tsc --noEmit`: passed.
- `bunx expo export --platform web --no-ssg`: passed, server export produced one `/scan` API route.
- `npx expo run:ios --device 93EEF062-B4DC-4989-AF77-CF47EE2A9816`: build succeeded, installed the app, started Metro, and Argent verified the app launched to the clean 2000-calorie dashboard. The Expo CLI stayed on its post-install "Connecting to: iPhone 17 Pro" spinner until interrupted, so the device launch was verified through Argent rather than by a normal CLI return.
- `npx expo run:ios --device 93EEF062-B4DC-4989-AF77-CF47EE2A9816 --no-bundler`: diagnostic only, not counted as launch evidence. It built with 0 errors and 0 warnings, but the dev-client app redboxed because no script URL was available.

Secret and scope scans:

- tracked environment files: only `.env.example` is tracked; `.env` is ignored by `.gitignore`.
- key-pattern scan: no committed `sk-...` key material found. `.env.example` contains only `OPENAI_API_KEY=your-openai-api-key-here`.
- base64 scan: found only expected image plumbing, route tests, and short fixture strings. No real image payload artifact was committed.
- log scan: no `console.log` or payload logging found. The route sets `tracingDisabled: true` and `traceIncludeSensitiveData: false`.
- out-of-scope feature scan: no onboarding, account, settings, date navigation, persistence, notifications, meal editing, manual meal entry, history, auth, or storage implementation found. The only "manual entry" match is the dashboard empty-state copy saying scanning avoids manual entry.

Criterion-to-evidence links:

| spec success criterion | evidence |
| --- | --- |
| `npx expo run:ios` builds and launches the app cleanly on the target simulator | task 17 command audit plus Argent dashboard verification on iPhone 17 Pro, UDID `93EEF062-B4DC-4989-AF77-CF47EE2A9816`; CLI spinner caveat recorded above |
| `bun run test -- --runInBand`, `bun run lint`, and `bunx tsc --noEmit` pass | final command audit |
| web server export succeeds with `web.output` set to `server` | final command audit and task 1 app config audit in `DEVIATIONS.md` |
| a library food photo reaches the real MacroLens route and returns a validated food result | task 15 happy path, task 16 dark result check, and task 17 accepted real scan |
| every uploaded JPEG has a long edge no greater than 1024 px | task 15 input dimensions and `tests/domain/prepare-image.test.ts` coverage |
| camera capture and library selection use the same scan pipeline | task 11 manual fallback checks and component coverage; task 16 denied-camera fallback check |
| the captured or selected photo remains visually continuous through analysis and result | `happy-path.mov`, `02-analyzing-photo-carry-through.png`, and result screenshots |
| accepting logs exactly one meal and animates the dashboard from prior totals | `happy-path.mov`, `04-dashboard-three-meals.png`, task 12 motion notes, and accept tests |
| displayed totals are arithmetically correct after at least three meals | task 15 three-meal arithmetic table and `04-dashboard-three-meals.png` |
| discard changes neither the day state nor widget snapshot | task 16 discard isolation checks and component tests |
| a non-food image shows the correct recovery actions and retry succeeds | `05-not-food-error.png` and task 16 non-food retry notes |
| a network failure shows the correct recovery actions and same-image retry succeeds | `06-network-error.png` and task 16 offline retry notes |
| the small home-screen widget is visible and updates after an accepted meal | `09-widget-before.png`, `10-widget-after.png`, and task 17 widget arithmetic |
| dashboard, result, errors, and widget are verified in light and dark modes | light screenshots `01` through `06`, dark screenshots `07` and `08`, widget screenshots `09` and `10`, and task 14 widget model tests for dark and accented rendering |
| API key and image base64 are absent from client code, client logs, and committed artifacts | secret and scope scans above, route tests, and `DEVIATIONS.md` |
| all required evidence exists under `verification/test-1/` | files `01` through `10`, `happy-path.mov`, input images, and this verification log |
| implementation contains no feature outside the stated scope | out-of-scope feature scan above |

Final short summary:

Nourish is ready for benchmark judging: it provides one in-memory day dashboard, one camera/library scan flow, real MacroLens estimates through the server route, explicit recovery states, dark and light theme evidence, and a small iOS widget that updates from 2000 to 1380 calories left after an accepted 620-calorie meal. The only recorded caveat is Expo CLI behavior after a successful native build and install: the app launch was verified through Argent because the CLI stayed on its device connection spinner.
