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
