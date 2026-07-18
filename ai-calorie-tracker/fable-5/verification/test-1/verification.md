# Nourish - verification log (test 1: AI calorie tracker)

Nourish is the fable-5 contestant build for the AI-native benchmark. This log records
the environment, commands, real inputs and results, arithmetic, and the evidence backing
each success criterion. Every AI result here comes from the real MacroLens route
(`@openai/agents`, model `gpt-5.6-luna`) with the real `OPENAI_API_KEY`; nothing in the
final evidence is mocked.

## environment

- device: iPhone 17 Pro Max simulator, iOS 27 (UDID 705C1405-E555-4C11-840D-A874D16FA712)
- host: macOS 26.5.2
- app: Nourish, bundle id `com.ramimaalouf.nourish`, Expo SDK 57, React Native 0.86,
  TypeScript strict, Expo Router (root `src/app/`)
- dev server: Metro on port 8087 (`bunx expo start --port 8087`); the native app's
  `/scan` request resolves against this dev-server origin
- backend: Expo Router API route `src/app/scan+api.ts`, `web.output: "server"`
- git head at verification: `dc1993b`

## commands run (final audit, all green)

```
bunx jest --runInBand          -> 161 passed, 17 suites
bunx tsc --noEmit              -> clean
bun run lint                   -> clean
bunx expo export --platform web --no-ssg
                               -> Exported; API routes (1): /scan
npx expo run:ios               -> builds and launches cleanly on the target simulator
```

secret / boundary / scope scans (all clean):

- the real API key value appears in no tracked file; `.env` is untracked
- `OPENAI_API_KEY` is referenced only inside `src/app/scan+api.ts` (server); the agents
  SDK reads it from the environment. no client module imports the route or a server helper
- no client code logs the API key, image base64, provider payload, or raw model output
- no out-of-scope feature present: no onboarding, auth, persistence (no AsyncStorage /
  SecureStore), history beyond today, streaks, settings, manual entry, date navigation,
  or push notifications. the only "notification" symbol is `Haptics.notificationAsync`

## the three real judging meals (happy path)

read directly from each real result card, light mode, in one session:

| # | photo | food (returned) | kcal | protein_g | carbs_g | fat_g |
|---|-------|-----------------|------|-----------|---------|-------|
| 1 | clean-dish.jpg (salad bowl) | Grilled chicken salad bowl with mixed vegetables, edamame, corn, tomatoes, eggs, and greens | 620 | 46 | 48 | 25 |
| 2 | mixed-plate.jpg (grill platter) | Assorted grilled meat skewers with roasted vegetables, potatoes, sauces, and flatbread | 1850 | 135 | 85 | 105 |
| 3 | clean-dish.jpg (salad bowl again) | Grilled chicken salad bowl with mixed vegetables, edamame, corn, tomatoes, cucumber, cabbage, lettuce, and boiled eggs | 620 | 48 | 48 | 25 |

independent arithmetic (goals: 2000 kcal / 150 P / 250 C / 70 F):

- consumed: 620+1850+620 = 3090 kcal; 46+135+48 = 229 P; 48+85+48 = 181 C; 25+105+25 = 155 F
- remaining shown on dashboard: "1090 calories over" (2000-3090), protein "79g over"
  (150-229), carbs "69g left" (250-181), fat "85g over" (70-155). every value matches
  the independent sum exactly. over-goal treatment (red ring + "over" labels) engages
  once consumption passes a goal.
- intermediate: after meal 1 -> 1380 left; after meal 2 -> 470 over. both exact.

## criterion-to-evidence map

prompt "definition of done" and spec "success criteria":

- [x] app builds and launches cleanly with `npx expo run:ios` - verified this session.
- [x] real library food photo returns real analysis and logs the meal - meals 1-3 above,
      `03-result-card-light.png`, `04-dashboard-three-meals.png`.
- [x] capture-to-analyzing transition smooth, photo carries through - `happy-path.mov`
      (frame extraction confirmed no blank frame, same photo framing analyzing->result),
      `02-analyzing-photo-carry-through.png`.
- [x] dashboard ring + macro bars animate on log; totals correct across 3+ meals -
      `happy-path.mov`, `04-dashboard-three-meals.png`, arithmetic above.
- [x] not-food image -> error state, retry works - `05-not-food-error.png`; "Try another
      photo" recovered to a real result (see `notes-task16.md`).
- [x] network failure -> error state, same-image retry works - `06-network-error.png`;
      metro killed then restarted, "Retry analysis" (no re-pick) returned a real 650 result.
- [x] home-screen widget shows calories remaining and updates after logging -
      `09-widget-before.png` (cold launch = 2000, empty ring), `10-widget-after.png`
      (after one 620 meal = 1380, partial ring). widget value equals the dashboard value.
- [x] light and dark verified - `07-dashboard-dark.png`, `08-result-card-dark.png`,
      plus light shots 01-06. live appearance switching used.
- [x] web server export succeeds with `web.output: server` - audit above; `/scan` emitted
      as an API route function.
- [x] every uploaded JPEG has a long edge <= 1024 px - enforced in
      `src/services/prepare-image.ts`, covered by `tests/domain/prepare-image.test.ts`.
- [x] camera and library share one pipeline - both dispatch `start_preparing` into the
      same `prepareImage` + analyze flow (`src/app/scan.tsx`); camera capture verified in
      task 10 (see checkpoints.md). no camera-specific analysis branch.
- [x] accept logs exactly one meal; discard changes neither day nor widget - accept-once
      enforced by the reducer and the day-state meal id; discard isolation held across
      every error/retry/discard cycle (dashboard stayed at 3 meals). tests:
      `scan-accept.test.tsx`, `scan-machine.test.ts`, `day-context.test.tsx`.
- [x] key and image base64 absent from client code, logs, and committed artifacts - secret
      scan above.
- [x] no feature outside the stated scope - scope scan above.

## judgment calls and deviations

recorded in `DEVIATIONS.md`:

1. router root is `src/app/` (this starter's convention), so the required route lives at
   `src/app/scan+api.ts` - same `POST /scan` URL.
2. `@openai/agents` and test/lint tooling were installed (the starter shipped only
   `expo-widgets`); jest pinned to 29.x for jest-expo 57 compatibility.
3. `expo-haptics` added for the spec-required capture/accept haptics.
4. the ios-only widget adapter is split into `widget.ios.ts` (real) and `widget.ts`
   (no-op) so `@expo/ui`/`expo-widgets` native code stays out of the web server bundle;
   this is what makes `expo export --platform web` succeed for an otherwise ios-only app.
5. widget tinted (ios 18 accented) rendering is left to the system's automatic recoloring;
   only semantic light/dark were custom-handled and visually verified (spec-compliant).

## honest notes

- `gpt-5.6-luna` intermittently returns a 502 that the app maps to the safe
  `analysis_failed` card; a direct `curl` to `/scan` returns 200 in ~1.5-3s, so this is
  upstream provider variance, not an app defect. the "Retry analysis" path absorbs it,
  which is the intended behavior, and no evidence was mocked to hide it.
- the happy-path recording is compressed h264 (737 KB) to keep the repo light; frame
  extraction around capture/analysis/result/accept confirmed the motion quality claims.

## final summary

Nourish delivers the exact prompt scope: a today-only dashboard (animated calorie ring,
macro bars, image-led meal rows, designed empty state), a camera + photo-library scan flow
that resizes to <=1024 px JPEG and calls the real MacroLens route, an AI result card with
accept/discard, explicit not-food / analysis / network failure states with correct
recovery, and a small iOS home-screen widget showing remaining calories that updates after
each accepted meal. State is in-memory and resets on cold launch (which also resets the
widget snapshot to 2,000). The full automated suite, typecheck, lint, web server export,
and a clean iOS launch all pass, with the API key kept server-side and no out-of-scope
features. All required evidence is in this folder.
