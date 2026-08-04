# implementation plan: nourish - ai calorie tracker

source of truth: `test-1-spec.md` alongside this plan. the contestant prompt
`../test-1-ai-calorie-tracker.md` remains the functional and backend ground truth.
if the plan and spec disagree, the spec wins.

status: draft for human review

## overview

build Nourish in the provided Expo SDK 57 starter as a sequence of testable vertical
slices. prove the two unfamiliar integrations first: the OpenAI Agents SDK vision route
and a real `expo-widgets` home-screen target. then deliver the library scan path end to
end before adding camera parity, recovery paths, motion, theme polish, and final
simulator evidence.

implementation stops at the prompt's exact scope: today's in-memory dashboard, scan,
result, failures, and one small widget.

## architecture decisions

- **two pure typed contracts:** `src/domain/scan-contract.ts` owns request/response
  validation shared by the route and client. `src/domain/nutrition.ts` owns meal types,
  fixed goals, derived totals, rounding, and progress clamping. neither imports server
  or native code.
- **one explicit scan reducer:** `src/domain/scan-machine.ts` represents acquisition,
  preparation, analysis, result, failures, acceptance, retry, and stale-request
  rejection. screen components render state instead of coordinating independent flags.
- **one photo pipeline:** camera and library both return a local URI to
  `prepare-image.ts`. only the prepared JPEG URI and base64 continue into analysis.
- **same-photo continuity:** the prepared image remains mounted as the full-screen
  background from preparation through analysis, result, and error. overlays change
  above it, avoiding a fragile cross-route shared-element dependency.
- **derived day state:** React context plus `useReducer` stores meals only. totals and
  remaining values are selectors, so dashboard and widget always receive the same
  arithmetic.
- **server boundary:** `app/scan+api.ts` alone creates and runs MacroLens, validates its
  final output, disables tracing, and converts failures to the documented safe response.
  no client module imports the route or a server-only helper.
- **widget boundary:** the widget factory is configured once with the exact
  `RemainingCaloriesWidget` name. a tiny adapter receives derived calories remaining
  and calls `updateSnapshot` on cold launch and accepted meals.
- **test-first implementation:** each behavior task starts with the smallest failing
  unit, component, or route test. user-visible flows are then verified on the simulator
  before the task is committed.
- **commit discipline:** one lowercase conventional commit per task. unrelated existing
  worktree changes stay out of those commits.

## dependency graph

```text
task 1: starter audit + test/build baseline
  ├─ task 2: real agents-sdk vision route spike
  ├─ task 3: real expo-widgets target spike
  └─ task 4: nutrition domain + scan reducer
       ├─ task 5: in-memory day state + widget adapter
       │    └─ task 6: dashboard vertical slice
       └─ task 7: library acquisition + image preparation
            └─ task 8: real analysis + result vertical slice
                 └─ task 9: accept/discard + dashboard/widget integration
                      ├─ task 10: camera acquisition parity
                      └─ task 11: failure, retry, cancellation, stale responses
                           └─ task 12: photo continuity + dashboard motion
                                ├─ task 13: theme, accessibility, native polish ─┐
                                └─ task 14: final widget design + update audit ─┤
                                                                                └─ task 15: happy-path evidence
                                                                                     └─ task 16: resilience + theme evidence
                                                                                          └─ task 17: widget + final audit
```

tasks 2, 3, and 4 are independent after task 1, but the benchmark should execute them
sequentially to keep commits, simulator state, and failure attribution clear. tasks 13
and 14 may be worked independently after task 12 if separate worktrees are explicitly
introduced. task 15 waits for both. no parallel implementation is required.

## phases and checkpoints

### phase 1: baseline and high-risk proofs (tasks 1-3)

audit the starter rather than assuming its paths or scripts. establish a clean build,
test harness, server output, and widget config. then prove one real food photo can pass
through the exact MacroLens route and prove a static Nourish widget appears on the ios
Simulator home screen.

**checkpoint 1:** app boots with `npx expo run:ios`; tests, lint, and typecheck pass; a
real route call returns validated nutrition; the static widget is visible on the home
screen. do not build product UI until both runtime risks are resolved.

### phase 2: deterministic product foundation (tasks 4-6)

build the pure domain and scan state machine, then the in-memory day provider and widget
adapter. deliver the first visible vertical slice: a polished empty dashboard that can
also render deterministic three-meal fixture state with correct arithmetic.

**checkpoint 2:** empty and populated dashboards render in the simulator; domain tests
prove totals, remaining values, over-goal behavior, legal transitions, accept-once, and
stale-request handling; a fixture meal updates the widget through the same adapter used
by production state.

### phase 3: complete food scan path (tasks 7-9)

add library acquisition and prepared JPEG generation, connect the real route, render
the result over the same photo, then wire accept and discard into day state and the
widget. this phase delivers the primary judging path before camera-specific work.

**checkpoint 3:** choosing a real food image from Photos visibly proceeds through
preparation, analysis, and result; accept logs one meal and updates dashboard plus
widget; discard changes neither.

### phase 4: camera parity and resilience (tasks 10-11)

add full-screen camera capture and permission handling through the existing image
pipeline. cover not-food, route, malformed-response, network, retry, cancellation, and
late-response behavior without introducing alternate screens or duplicated logic.

**checkpoint 4:** camera and library converge on one pipeline; denied camera still
offers Photos; a non-food image recovers through another photo; an offline request
recovers by retrying the same prepared image; discarded and stale results never log.

### phase 5: native-feel hardening (tasks 12-14)

lock down same-photo continuity and honest loading motion, then animate dashboard
changes. audit light and dark themes, safe areas, accessibility, reduced motion,
haptics, and touch targets. finish the small widget's production visual design and
snapshot consistency.

**checkpoint 5:** screen recording shows no blank frame or geometry jump from photo to
analysis to result; ring and bars settle together within the spec's motion window;
light/dark and reduce-motion passes are clean; widget before/after values match the app.

### phase 6: verification and handoff (tasks 15-17)

run the complete definition of done on the fixed simulator with the fixed judging
images in three bounded passes. first capture the food happy path and motion, then
failure and theme evidence, then widget snapshots and the final command audit. fix
every issue found before completing its pass.

**final checkpoint:** every success criterion in `test-1-spec.md` has direct evidence
or is honestly marked incomplete. `verification/test-1/verification.md` links all
artifacts and provides the short final summary requested by the prompt.

## verification policy

every implementation task must satisfy this standing bar before its commit:

1. the task's focused tests pass
2. `bunx tsc --noEmit` passes
3. `bun run lint` passes when the starter exposes the lint script
4. the app still launches if the task touches runtime code
5. the task's manual simulator check passes when it changes user-visible behavior
6. no secret, base64 image payload, generated native build output, or unrelated file is
   staged
7. any compliant deviation is recorded in `DEVIATIONS.md` before the commit

checkpoint commands:

```text
bun run test -- --runInBand
bun run lint
bunx tsc --noEmit
bunx expo export --platform web --no-ssg
npx expo run:ios
```

## risks and mitigations

| risk | impact | mitigation |
|---|---|---|
| `@openai/agents` image input or package bundling fails in the Expo API route | high | task 2 is a real runtime spike before UI work; use current official types and docs; do not silently replace the required SDK |
| the named model is unavailable or does not accept image input | high | call it with the benchmark key and one known food JPEG at checkpoint 1; record the exact provider response if externally blocked |
| native relative `fetch('/scan')` does not resolve to the development server | high | prove the route from the simulator in task 2; inspect Expo Router origin behavior before adding a custom URL |
| widget target builds but is absent or stale on the home screen | high | task 3 proves config name, supported family, development build, gallery placement, and `updateSnapshot`; keep app config and factory name identical |
| widget snapshot conflicts with intentionally in-memory app state | medium | reset the snapshot to default goals on each cold app launch, then update only after accepted meals |
| selected images create large JSON bodies or memory spikes | medium | resize before base64 conversion, JPEG quality 0.82, validate dimensions in tests, and reject unreasonable request sizes before the model call |
| camera and library drift into separate behaviors | medium | both produce a URI and call the same preparation event; camera task may not fork analysis or error logic |
| late network responses log a discarded photo | high | reducer owns a request id; tests cover discard, retry, replacement, and out-of-order completion |
| AI returns malformed or unsafe numeric values | medium | validate at the server response boundary and again in the typed client; negative, non-finite, and out-of-range confidence values fail safely |
| photo transition flashes or changes crop | high | keep one prepared-image layer mounted and switch overlays; record at slow animation speed and normal speed in task 12 |
| simulator camera limitations prevent capture proof | low | library is the required simulator path; verify camera permission and UI there, then use a physical device only if available without blocking the benchmark |
| visual polish drifts into out-of-scope tabs or history | medium | compare every new control to the explicit scope before landing; screenshots guide hierarchy, not feature count |

## file ownership and coordination

shared files with the highest conflict risk are `app/scan.tsx`, `app/index.tsx`,
`app/_layout.tsx`, `app.json`, and `src/state/day-context.tsx`. tasks touching them are
ordered sequentially. later tasks refine existing behavior through focused components
instead of reopening the architecture.

tests mirror the production boundary they verify:

- `tests/domain/` for pure nutrition and scan transitions
- `tests/route/` for request validation and Agents SDK behavior
- `tests/components/` for visible states and actions
- `verification/test-1/` for real simulator evidence only

## open questions

none block implementation. the only expected discoveries are runtime facts from the
two phase-1 spikes. if either required integration is externally unavailable, stop that
checkpoint, record exact evidence, and keep the implementation compliant rather than
substituting a different product or backend.
