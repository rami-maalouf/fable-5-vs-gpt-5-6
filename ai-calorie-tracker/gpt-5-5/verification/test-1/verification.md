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
