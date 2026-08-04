# implementation plan: twilight - swift to expo port

source of truth: the spec delivered alongside this plan (`test-3-spec.md`). this plan
sequences the work; the spec defines what "correct" means. if they disagree, the spec
wins. the detailed per-task checklist lives in `todo.md`.

## overview

port Twilight (SwiftUI sleep tracker) to a fresh expo sdk 57 app in the current
working directory: feature parity on the sleep core, pixel-faithful ui per the spec's
design tokens, metric-number parity proven by golden fixtures, plus a live activity
with an interactive wake-up button and wind-down state (the superpower), and an
android boot as the bonus. ios is the primary target; the original swift source at
`/Users/rami/Documents/code/swift/simple-sleep-tracker` is the read-only reference.

## architecture decisions (rationale in the spec)

- **pure-ts domain layer** (`src/domain/`): session rules and the metrics engine have
  zero react/expo imports so golden-fixture tests run in plain jest. this is where
  parity is proven.
- **expo-sqlite for sessions, kv-store for settings** - mirrors SwiftData +
  UserDefaults split without extra native deps.
- **skia for signature visuals** (starfield, moon, circular picker, card auroras);
  **victory-native first for charts** with a hand-rolled-skia fallback decided by an
  early spike, not mid-build.
- **standard system tab bar, tinted** - the original uses stock TabView; do not build
  a custom tab bar.
- **theme as context**: components never hardcode hexes; the token tables in the spec
  are normative.
- **spikes before deep implementation**: the three unknowns (expo-widgets
  interactivity, chart fidelity, grayscale) get timeboxed spikes in phase 2 so no
  later phase lands on an unproven assumption.
- **one commit per task, conventional prefixes; every intentional difference from the
  original goes in DEVIATIONS.md.**

## dependency graph

```
scaffold (app shell, deps)
  ├─ theme module ──────────────┐
  ├─ domain: session rules ─┐   │
  │    └─ metrics engine ─┐ │   │
  ├─ data: sqlite + kv ───┤ │   │
  │                       │ │   │
  ├─ screen chrome (starfield, cards) ─┤
  │                       │ │   │      │
  spikes (widgets / charts / grayscale)│
  │                       │ │   │      │
  └─ core flow: toggle -> logs -> editor (needs rules+data+picker)
        └─ dashboard fidelity (needs engine + chart spike)
              └─ remaining screens (settings, onboarding, metrics)
                    └─ polish (animations, haptics, notifications)
                          └─ live activity (parity -> superpower)
                                └─ android boot
```

## phases and checkpoints

### phase 1: foundation (tasks 1-5)
scaffold + domain rules + data layer + theme + screen chrome. ends with a themed,
navigable 4-tab shell and green unit tests.

**checkpoint 1:** `bunx expo run:ios` boots the shell; `bun run test` and
`bunx tsc --noEmit` green; tab bar and gradient/starfield match the original's look.

### phase 2: risk burn-down (tasks 6-8)
the three spikes from the spec's risk list, timeboxed. each produces a written
decision (in DEVIATIONS.md or a spike note), not polished code.

**checkpoint 2:** decisions recorded for: superpower feasibility (interactive button
vs fallback), chart approach (victory-native vs skia), grayscale approach. spec open
questions 1-2 resolved.

### phase 3: core sleep flow (tasks 9-13) - spec priority 2
vertical slice "track a night": circular picker component, sleep toggle with the
5-minute rule, grayscale-while-asleep, logs list, log editor.

**checkpoint 3:** on the simulator: toggle sleep -> wake -> session appears in logs
-> edit via circular picker -> delete. sub-5-minute session shows the joke toast and
never appears anywhere. behavior matches the original side by side.

### phase 4: metrics engine (tasks 14-16) - the numbers
pure-ts port of SleepMetricsAnalyzer + SleepDataUtils, then golden fixtures.

**checkpoint 4:** all fixture sets pass; every constant (±0.75h, -40/hr, -30/hr,
0.35/0.30/0.20/0.15, EMA 0.8/0.2, 18:00 base) traced to a passing test.

### phase 5: dashboard fidelity (tasks 17-19) - spec priority 3
full dashboard: greeting/status card/view modes, week chart, 7-night avg + alignment
cards.

**checkpoint 5:** side-by-side screenshots vs the original dashboard (both night
palettes + sunset) - rami approves before moving on.

### phase 6: remaining screens (tasks 20-24) - spec priority 4-5
settings, onboarding (4 steps), metrics screen with all charts and the timeline
sheet.

**checkpoint 6:** every screen walkable side by side with the original; metrics
charts visually match mark-for-mark per the spec's chart table.

### phase 7: polish (tasks 25-26) - spec priority 6
animation/haptic pass, copy banks wired with selection logic, wind-down notification,
edge cases and empty states.

**checkpoint 7:** fps overlay check during starfield + chart scrub; haptic map
matches the spec; wind-down notification fires 3h before bedtime.

### phase 8: live activity (tasks 27-28) - spec priority 7
parity first (progress, elapsed/remaining, island states, relaunch restore), then the
superpower per the spike decision.

**checkpoint 8:** verified on a physical device (dynamic island polish cannot be
judged on the simulator) - rami relays what the device shows.

### phase 9: android bonus (task 29) - spec priority 8
boot and navigate; fix crashes only. no polish, per the spec.

**final checkpoint:** the spec's success criteria checklist, DEVIATIONS.md complete,
all tests green, one commit per task in history.

## risks and mitigations

| risk | impact | mitigation |
|---|---|---|
| expo-widgets can't do interactive live-activity buttons | high (superpower beat) | spike in phase 2; fallback = wind-down state + richer island content (pre-agreed in spec) |
| victory-native can't match swift charts' look | med | spike renders the hardest chart (week chart, dual axis + negative offsets) first; skia fallback decided there |
| no whole-tree grayscale in rn | med | spike compares desaturated-palette swap vs native filter; palette swap is the safe default |
| circular picker feel is off | med | built early (task 9) as a standalone component; feel-tested on device before the editor depends on it |
| timezone bugs in wake-day attribution | high (corrupts every metric) | rules isolated in pure ts with dst/travel/midnight fixtures before any ui consumes them |
| live activities need a dev build + physical device | low | known constraint; simulator for all ui work, device pass at checkpoint 8 |

## parallelization

safe to parallelize: tasks 2/3/4 after scaffold; the three spikes; tasks 20/21/22
(independent screens); metrics chart tasks 23/24.
must be sequential: 1 before everything; 9 before 13; 14-15 before 16 and before
17-19; 27 before 28.
shared contract: the domain layer's types (task 2) are the contract everything else
imports - land them first and keep them stable.

## open questions (carry from spec)

1. spike results (expo-widgets interactivity, chart library) - resolved at
   checkpoint 2.
2. onboarding pacing: 4 steps proposed (welcome, schedule, notifications, finish).
3. wind-down notification: plain reminder (like the original) or deep-link into a
   wind-down mode - default is plain reminder, parity first.
