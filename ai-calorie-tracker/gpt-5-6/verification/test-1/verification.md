# Nourish verification

Verified on 2026-07-17 using an iPhone 17 Pro simulator running iOS 26.5.

- Simulator UDID: `B47A3DF3-056A-4531-B9FA-8327C7C8A485`
- App bundle: `com.rami.nourish`
- Expo SDK: 57
- Evidence size: every PNG is 1206 x 2622
- Motion evidence: 1206 x 2622, 30 fps, 22.1 seconds

## Final evidence

| Artifact | What it proves |
| --- | --- |
| [01-dashboard-empty-light.png](./01-dashboard-empty-light.png) | Fresh in-memory day, 2,000 kcal remaining, designed empty state, and reachable scan action in light mode. |
| [02-analyzing-photo-carry-through.png](./02-analyzing-photo-carry-through.png) | The selected prepared food photo remains visible behind the honest indeterminate analysis treatment. |
| [03-result-card-light.png](./03-result-card-light.png) | Validated result observed during the live simulator run over the same photo with calories, macros, accept, and discard. No redacted route log was retained to independently prove the model call. |
| [04-dashboard-three-meals.png](./04-dashboard-three-meals.png) | Three accepted scans, exact over-goal arithmetic, clamped progress, thumbnails, and meal rows. |
| [happy-path.mov](./happy-path.mov) | User-level library selection, same-photo analysis, result, accept, and synchronized dashboard animation. |
| [05-not-food-error.png](./05-not-food-error.png) | Real stapler input, prepared-photo context, distinct `Try another photo`, and `Discard`. |
| [06-network-error.png](./06-network-error.png) | Prepared-food context, distinct connection copy, same-photo `Retry analysis`, and `Discard`. |
| [07-dashboard-dark.png](./07-dashboard-dark.png) | Final dark dashboard at the true top with clean status bar, safe areas, contrast, empty state, and fixed action. |
| [08-result-card-dark.png](./08-result-card-dark.png) | Real dark result card with readable photo overlay, values, and actions. |
| [09-widget-before.png](./09-widget-before.png) | Fresh widget snapshot with exactly 2,000 kcal remaining and no prior-run state. |
| [10-widget-after.png](./10-widget-after.png) | Final rebuilt widget with exactly 1,050 kcal remaining after the matching 950 kcal accepted meal. |

## Commands and results

All commands ran from the app root.

| Command | Result |
| --- | --- |
| `bun run test -- --runInBand` | Passed: 19 suites, 101 tests, 0 snapshots. |
| `bun run lint` | Passed. |
| `bunx tsc --noEmit` | Passed. |
| `env -u NO_COLOR bunx expo export --platform web --no-ssg` | Passed with server output, one `/scan` API route, and no warnings. The required unprefixed export command also completed; its only warnings were the shell's conflicting inherited `NO_COLOR` and `FORCE_COLOR` values. |
| `npx expo run:ios` | Built, installed, and launched on iPhone 17 Pro with 0 errors and 0 warnings. |
| tracked secret scan | Passed: no `sk-...` shaped value is tracked and `.env.example` is the only tracked environment file. |
| out-of-scope scan | Passed across `app`, `src`, and `widgets`: no auth, sign-in, history, manual entry, barcode, subscription, onboarding, or profile feature. |
| `git diff --check` | Passed before the final commit. |

The native launch emitted only simulator/framework debug noise after the successful build, including a transient CFNetwork connection attempt while the development client was changing Metro ports. The Xcode build itself reported 0 errors and 0 warnings, and the app rendered normally.

## Real inputs and arithmetic

The final judging assets in Photos were a mixed salmon-pasta plate, a fried-chicken plate, and a non-food stapler. Nutrition is a real AI estimate, so repeated runs may vary.

The three-meal arithmetic evidence used three accepted scans across the two food assets:

| Accepted scan | Calories | Protein | Carbs | Fat |
| --- | ---: | ---: | ---: | ---: |
| Salmon, penne, broccoli, and salad | 950 kcal | 56 g | 105 g | 35 g |
| Fried chicken plate | 1,400 kcal | 91 g | 62 g | 89 g |
| Salmon, penne, broccoli, and salad repeat | 950 kcal | 56 g | 105 g | 35 g |
| **Displayed total** | **3,300 kcal** | **203 g** | **272 g** | **159 g** |

Expected remaining values against fixed goals:

- Calories: `2000 - 3300 = -1300`
- Protein: `150 - 203 = -53`, displayed as `53 g over`
- Carbs: `250 - 272 = -22`, displayed as `22 g over`
- Fat: `70 - 159 = -89`, displayed as `89 g over`

The widget checkpoint used a separate clean process. Its accepted salmon result was 950 kcal, so both the dashboard accessibility value and widget reported `2000 - 950 = 1050` remaining. The widget updated before the home-screen check completed.

## Failure, cancellation, and accessibility checks

- Non-food: a real stapler photo returned the not-food surface. `Try another photo` opened Photos and a subsequent salmon scan succeeded in the manual walkthrough. The post-retry success was observed but not separately recorded.
- Network: one client `/scan` fetch was rejected once at the transport boundary while the app was live. `Retry analysis` reused the already prepared salmon image and succeeded after the transport was restored. Global simulator connectivity was not disabled, and the post-retry success was observed but not separately recorded.
- Discard: discarding successful estimates and errors left dashboard totals and the widget unchanged.
- Stale response: a live response was held, the scanner was closed, and the response was released afterward. No modal, meal, total, or widget mutation occurred.
- Camera denial: camera permission was denied through the simulator service. The app explained that camera access was off while keeping Photos enabled, then camera permission was restored.
- Larger text: `accessibility-extra-large` was tested on dashboard, acquisition, analysis, and result. A dashboard remount on live font-scale changes and explicit scanner top inset fixed the clipping and status-bar issues found during this sweep.
- Reduce Motion: enabled in the real iOS Motion settings. Analysis used the static status marker instead of a spinner; numeric and overlay tests also prove immediate or opacity-only alternatives.
- VoiceOver: this iOS 26.5 simulator image does not expose VoiceOver in Accessibility and Settings search returns no result. A true VoiceOver gesture sweep could not be run. The simulator's native accessibility service was used instead and exposed an ordered, concise element for calories, each macro, meal rows, scan actions, error actions, result actions, and widget values. Automated role, label, live-region, and target-size coverage is in [accessibility.test.tsx](../../tests/components/accessibility.test.tsx).

## Criterion mapping

| Criterion | Direct evidence |
| --- | --- |
| Clean iOS build and launch | `npx expo run:ios`: 0 errors, 0 warnings; [01](./01-dashboard-empty-light.png). |
| Full test, lint, and typecheck gates | 19 suites and 101 tests; lint and TypeScript passed. |
| Server web export | Export succeeded with `web.output: server` and `/scan`. |
| Real library analysis through MacroLens | The live library run produced [02](./02-analyzing-photo-carry-through.png), [03](./03-result-card-light.png), and [happy-path.mov](./happy-path.mov). Exact route configuration is covered by [scan-api.test.ts](../../tests/route/scan-api.test.ts), which mocks the Agents SDK. No redacted server/request log was retained, so the saved artifacts do not independently prove that the recorded run reached the real model. |
| JPEG long edge at most 1024 px | Boundary behavior is covered by [prepare-image.test.ts](../../tests/domain/prepare-image.test.ts). All live scans used the same preparation service. |
| Camera and library share one pipeline | [camera.test.tsx](../../tests/components/camera.test.tsx), the denied-camera manual check, and the library evidence above. |
| Continuous photo through analysis and result | [happy-path.mov](./happy-path.mov), [02](./02-analyzing-photo-carry-through.png), and [03](./03-result-card-light.png). |
| Accept exactly once and synchronized animation | [happy-path.mov](./happy-path.mov), [scan-accept.test.tsx](../../tests/components/scan-accept.test.tsx), and [04](./04-dashboard-three-meals.png). |
| Correct totals after at least three meals | [04](./04-dashboard-three-meals.png) and the arithmetic table above. |
| Discard and stale completions cannot mutate state | Manual checks plus [scan-machine.test.ts](../../tests/domain/scan-machine.test.ts) and [scan-accept.test.tsx](../../tests/components/scan-accept.test.tsx). |
| Non-food recovery | [05](./05-not-food-error.png) directly proves the failure surface and actions. The successful new-photo retry was manually observed but has no separate post-retry artifact. |
| Network recovery with the same image | [06](./06-network-error.png) directly proves the failure surface and actions. The same-image retry success was manually observed but has no separate post-retry artifact. |
| Small widget updates after accept | [09](./09-widget-before.png), [10](./10-widget-after.png), and [remaining-calories-widget.test.ts](../../tests/widget/remaining-calories-widget.test.ts). |
| Light and dark app surfaces | [01](./01-dashboard-empty-light.png), [03](./03-result-card-light.png), [05](./05-not-food-error.png), [06](./06-network-error.png), [07](./07-dashboard-dark.png), and [08](./08-result-card-dark.png). Dashboard and result have live light/dark artifacts. Errors and widget have live light artifacts only. Widget dark/tinted color models are covered by [remaining-calories-widget.test.ts](../../tests/widget/remaining-calories-widget.test.ts); no live dark error or dark widget screenshot was retained. |
| No API key or image payload exposure | Tracked secret and evidence-artifact scans passed. The route boundary and safe failures are covered by [scan-api.test.ts](../../tests/route/scan-api.test.ts). No client-log capture was retained, so absence from runtime client logs is not independently evidenced. |
| All required evidence exists | Ten full-resolution PNGs, one movie, and this ledger are present in this directory. |
| No out-of-scope feature | Source scan passed; the router contains only dashboard, scan modal, and `/scan`. |

## Judgment calls and deviations

- State intentionally remains in memory. A cold launch resets the day and immediately resets the widget snapshot.
- The same salmon asset was accepted twice to reach three meals and prove aggregate arithmetic without inventing another food input.
- Network recovery was exercised through a one-shot transport rejection rather than a global simulator network toggle. The visible state and same-prepared-image retry path are the production paths, but the successful retry was not separately recorded.
- VoiceOver is unavailable in this simulator runtime. Native accessibility inspection and automated semantics coverage are complete, but this remains the one incomplete manual environment check.
- Live dark screenshots were retained for dashboard and result, not errors or the widget. Those missing live dark artifacts remain an evidence limitation despite shared theme-token and widget-model coverage.
- The live result was observed during the real walkthrough, but no redacted server log was retained to independently establish the recorded model request. Client runtime logs were also not saved for privacy inspection.
- No product or backend behavior departs from the prompt, so `DEVIATIONS.md` was not created.

## Final short summary

Nourish is a focused iOS calorie tracker with a polished in-memory dashboard, camera and Photos acquisition, client-side JPEG preparation, a real server-only MacroLens analysis route, same-photo analysis and result states, explicit recovery paths, accessible light/dark UI, synchronized nutrition motion, and a small updating home-screen widget.

The main judgment calls were to keep the written scope ahead of screenshot-only features, use a fixed 2,000 kcal and macro goal set, retain AI results as estimates, reuse one food asset for the third arithmetic scan, and use a one-shot live transport rejection for deterministic network recovery. The retained visual record and its explicit gaps are linked in the evidence table and criterion mapping above.
