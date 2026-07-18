# task 15 - happy path evidence

device: iPhone 17 Pro Max, iOS 27, light mode. all results from the real MacroLens
route (`gpt-5.6-luna`) over metro on port 8087 with the real `OPENAI_API_KEY`. no mocks.

## the three accepted meals (values read from each real result card)

| # | photo | food (as returned) | calories | protein_g | carbs_g | fat_g |
|---|-------|--------------------|----------|-----------|---------|-------|
| 1 | clean-dish.jpg (salad bowl) | Grilled chicken salad bowl with mixed vegetables, edamame, corn, tomatoes, eggs, and greens | 620 | 46 | 48 | 25 |
| 2 | mixed-plate.jpg (grill platter) | Assorted grilled meat skewers with roasted vegetables, potatoes, sauces, and flatbread | 1850 | 135 | 85 | 105 |
| 3 | clean-dish.jpg (salad bowl again) | Grilled chicken salad bowl with mixed vegetables, edamame, corn, tomatoes, cucumber, cabbage, lettuce, and boiled eggs | 620 | 48 | 48 | 25 |

## independent arithmetic vs displayed dashboard

daily goals: 2000 kcal, 150 g protein, 250 g carbs, 70 g fat.

consumed sums (independently recalculated):

- calories: 620 + 1850 + 620 = 3090
- protein: 46 + 135 + 48 = 229 g
- carbs: 48 + 85 + 48 = 181 g
- fat: 25 + 105 + 25 = 155 g

remaining = goal - consumed:

- calories: 2000 - 3090 = -1090 -> dashboard shows "1090 calories over" (red ring). match.
- protein: 150 - 229 = -79 -> dashboard "229g of 150g" + "79g over". match.
- carbs: 250 - 181 = 69 -> dashboard "181g of 250g" + "69g left". match.
- fat: 70 - 155 = -85 -> dashboard "155g of 70g" + "85g over". match.

intermediate check after meal 1 (single meal): dashboard showed 1380 left (2000-620),
protein 104 left, carbs 202 left, fat 45 left. match.
intermediate check after meal 2 (two meals): dashboard showed 470 over (2470-2000),
protein 31 over, carbs 117 left, fat 60 over. match.

every displayed total equals the independent sum exactly. over-goal treatment (red ring
+ "over" labels) renders once consumption passes a goal. the third accepted meal logged
correctly (validates the meal-id collision fix from task 12).

## files

- `01-dashboard-empty-light.png` - cold-launch empty dashboard, 2000 left, empty ring.
- `02-analyzing-photo-carry-through.png` - analyzing pill over the salad photo (meal 1),
  same crop/frame as the picked photo, no blank frame.
- `03-result-card-light.png` - meal 1 result card over its photo, all fields + AI ESTIMATE
  label + accept/discard.
- `04-dashboard-three-meals.png` - three meal rows (each with its photo thumbnail and
  macros) and the over-goal summary.
- `happy-path.mov` - one full real flow (scan -> library -> salad -> analyzing over the
  photo -> result -> accept -> dashboard animates to populated). compressed h264.
  frame extraction confirmed photo carry-through with no blank frame and the same photo
  framing from analyzing through result.
