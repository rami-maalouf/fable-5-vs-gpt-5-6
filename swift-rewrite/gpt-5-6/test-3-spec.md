# spec: twilight - swift to expo port

(for rami, not the models. phase-1 spec of the spec-driven workflow. source of truth
for every decision below; the plan and tasks get generated from this, not around it.)

status: DRAFT v2 - reframed jul 16: the project IS the port. convert Twilight (SwiftUI)
to a react native + expo app with all core features and the exact UI styling of the
original, using native components and native modules wherever needed to match. the
video test-3 artifacts that fall out of this work live in the appendix.

## objective

port **Twilight**, rami's production SwiftUI sleep tracker, to a fresh expo sdk 57 app
with:

- **feature parity** on the sleep core: sessions, logging/editing, dashboard, metrics,
  onboarding, settings, theming, notifications, live activity
- **pixel-faithful UI**: same palettes, typography, spacing, glass, starfield, circular
  pickers, chart shapes - side by side with the original, a viewer should struggle to
  tell them apart
- **metric-number parity**: the ported analytics engine produces the same numbers as
  `SleepMetricsAnalyzer` for the same session data, proven by shared fixtures
- **the superpower**: a live activity that goes beyond the original's - interactive
  wake-up button (lock screen + dynamic island) and a wind-down countdown state
- **android bonus**: the app boots and navigates on android from the same codebase

user = rami (and eventually twilight's real users). success looks like: original on
phone A, port on phone B, every core flow walkable side by side with matching visuals
and numbers, plus the port doing two things the original cannot (interactive island,
android).

## ground truth (audited jul 16 against the swift source)

app: **Twilight** at `/Users/rami/Documents/code/swift/simple-sleep-tracker`
(xcode project at repo root, app source in `Twilight/`, extension targets
`TwilightWidget`, `TwilightDeviceMonitor`, `TwilightShieldConfig`). ~28,300 lines of
swift; the sleep-tracking core is ~12-14k lines. forked from the foqos app blocker -
blocking machinery still compiles but is invisible in the product (config UI commented
out, onboarding creates a profile with an empty block list).

key facts the port must respect:

1. **the original already has a polished live activity** ("Rejuvenating..." progress
   toward sleep goal, elapsed/remaining, dynamic island compact/minimal/expanded,
   restores on relaunch - `Utils/LiveActivityManager.swift`,
   `TwilightWidget/TwilightWidgetLiveActivity.swift`). parity first, then the
   superpower.
2. **a prior RN port exists** (`twilight-rn/`, expo sdk 56, zustand/uniwind/skia).
   decision: fresh start (below); twilight-rn stays untouched and may be consulted as
   a second reference, but code is written fresh.
3. **healthkit:** the original writes completed valid sessions to apple health as
   `sleepAnalysis` samples (read scope only manages its own samples). port substitutes
   local persistence only (out of scope below).

## decisions (jul 16, with rami)

- **the project is the port itself**, not just video-test prep.
- **port home: fresh expo sdk 57 app.** the working directory is provided at
  implementation time (this spec, plan, and todo travel with it) - the spec does not
  pin a path. latest expo-widgets for live activities; no inherited architecture.
- **superpower = both:** live-activity parity + interactive wake-up button +
  wind-down countdown state; then android boot as the bonus.
- **scope = sleep core only.** OUT of scope: FamilyControls/ManagedSettings app
  blocking, healthkit sync, NFC/QR hardware flows, storekit tip jar, telemetrydeck
  analytics, BGTaskScheduler background tasks, demo-data manager, data export/archive,
  app intents/shortcuts/control-center widget, break-glass emergency flow, breaks
  during sessions (foqos vestige).

## tech stack

| concern | choice | notes |
|---|---|---|
| framework | expo sdk 57, react native, typescript (strict) | fresh `create-expo-app` |
| navigation | expo-router (tabs + formSheet modals) | mirrors TabView + sheet presentation |
| state | zustand (app state) + react context (theme) | light; no redux |
| persistence | expo-sqlite (sessions) + expo-sqlite/kv-store (settings) | replaces SwiftData + UserDefaults |
| animation | react-native-reanimated 4 + react-native-gesture-handler | springs, drag gestures |
| canvas | @shopify/react-native-skia | starfield, moon, circular pickers, chart custom draws |
| charts | victory-native (xl, skia-based) first; hand-rolled skia where it can't match | scrub/selection required; spike early (see risks) |
| glass/materials | expo-blur | .thinMaterial / .ultraThinMaterial equivalents |
| icons | expo-symbols (sf symbols, ios) + @expo/vector-icons fallback (android) | original uses sf symbols throughout |
| pickers | @react-native-community/datetimepicker (native wheels) + custom circular picker | settings uses native DatePickers |
| live activity / widgets | expo-widgets + @expo/ui swift-ui components | ts/jsx `'widget'` directive; needs dev build |
| notifications | expo-notifications | daily wind-down trigger, 3h before bedtime |
| haptics | expo-haptics | |
| deep links | expo-linking (`twilight://` scheme registered) | nfc flows out of scope, scheme kept |
| testing | jest-expo + @testing-library/react-native; maestro (stretch) | plus golden fixtures, below |

## commands

(bun everywhere, per house rules)

(run from the app root - wherever this spec lands)

```
create:    bunx create-expo-app .   # only if the working dir is not already an expo app
add dep:   bunx expo install <pkg>
dev run:   bunx expo run:ios            # dev build; expo go cannot do live activities
android:   bunx expo run:android
test:      bun run test                 # jest-expo
lint:      bunx expo lint
typecheck: bunx tsc --noEmit
```

## project structure

```
<app root>/
  app/                       # expo-router
    _layout.tsx              # theme provider, onboarding gate
    (tabs)/
      _layout.tsx            # 4 tabs: home, metrics, logs, settings
      index.tsx              # dashboard
      metrics.tsx
      logs.tsx
      settings.tsx
    onboarding/              # 6-step stack
    log-editor.tsx           # formSheet modal (create/edit session)
  src/
    domain/                  # PURE TS, no react imports
      models.ts              # SleepSession, SleepSettings types
      session-rules.ts       # 5-min rule, wake-day attribution, canonical night
      metrics/               # SleepMetricsAnalyzer port, function-for-function
    data/                    # sqlite repository + kv settings store
    theme/                   # palettes, tokens, ThemeProvider, useTheme
    components/
      common/                # StarfieldView, GlowingMoon, GlassButton, CardBackground,
                             # CircularTimePicker, MultiStatCard, ChartCard...
      dashboard/             # view-mode cards, status card, sleep toggle button
      charts/                # chart wrappers matching swift charts look
    services/                # notifications, live-activity, haptics
    copy/                    # greetings, wind-down messages, sub-5-min jokes
  widgets/                   # expo-widgets live activity (ts/jsx)
  tests/
    fixtures/                # golden session sets + expected metric outputs
  assets/
```

## code style

```ts
// theme comes from context; components never hardcode palette hexes
export function StatusCard({ night }: { night: NightRecord }) {
  const theme = useTheme();
  // duration renders as "7h 32m", matching the original's formatter
  return (
    <CardBackground>
      <Text style={[styles.duration, { color: theme.textPrimary }]}>
        {formatDuration(night.durationSeconds)}
      </Text>
    </CardBackground>
  );
}
```

- lowercase comments, no emojis, hyphens not em dashes
- domain layer is pure ts: no react, no expo imports - it must be unit-testable in node
- every port file header names its swift source (`// ports: Utils/SleepMetricsAnalyzer.swift`)
- conventional commits, one commit per completed task

## data model (ports SwiftData + UserDefaults)

**`sleep_sessions` table** (from `BlockedProfileSession`, sleep-relevant fields only):

| column | type | notes |
|---|---|---|
| id | text pk | uuid string |
| tag | text | "Manual Log" for editor-created entries |
| start_time | integer | epoch ms |
| end_time | integer nullable | null = active session |
| start_tz / end_tz | text | iana identifiers - timezone correctness is load-bearing |
| created_at / updated_at | integer | |

**settings** (kv-store, from `SleepSettings` + `@AppStorage`): `is_onboarded`,
`optimal_sleep_minutes` / `optimal_wake_minutes` (minutes since midnight),
`wind_down_reminder_enabled` (default true), `theme_mode` (system/light/dark, default
dark), `theme_palette` (twilight/amethyst, default twilight; sunset applies in light mode),
`live_activity_enabled` (default true), `live_activity_id` (restore on relaunch).

**invariants (session-rules.ts, all from the swift source):**

- a session under **5 minutes (300s) is invalid** and hidden from every list, chart,
  and metric; ending one triggers the jokey toast instead of a save celebration
- a session belongs to its **wake day** (`startOfDay(endTime)` in the session's tz)
- when a wake day has several sessions, the **longest is the canonical night**
- an active session = `end_time` null; exactly one may be active
- all date math is timezone-aware using the stored identifiers, never the device default

## metrics engine (ports `Utils/SleepMetricsAnalyzer.swift`, 796 lines, + `Views/SleepDataModels.swift`)

pure ts module, function-for-function. the formulas the port must reproduce exactly:

- night records built per wake day; time-of-day offsets computed against an **18:00
  base hour** (so bedtimes crossing midnight sort correctly)
- averages: mean/median/total/longest/shortest duration; tracking coverage
- **goal-hit rate**: night counts as a hit within **±0.75h** of the sleep goal
- duration trend % and **7-day moving average** series
- **consistency** (dashboard): std-dev based, **-40 pts per hour** of deviation;
  schedule **accuracy vs optimal: -30 pts per hour**
- rolling **14-day consistency** (bedtime/wake/schedule-accuracy) on metrics screen
- **social jetlag**: weekend vs weekday sleep midpoint delta
- **cumulative sleep debt** vs goal
- weekday averages; duration histogram buckets
- current/longest **streak** of tracked nights
- **sleep alignment score**: weighted geometric mean - duration 0.35, timing 0.30,
  phase 0.20, consistency 0.15 - with EMA trend smoothing
- ranges: 30D / 90D / 1Y / All (metrics); Week + 90D-vs-All toggle (dashboard)

parity is proven by golden fixtures (testing strategy below), not by eyeballing.

## screens (what "done" looks like, per screen)

1. **dashboard (home tab)** - greeting (tap to shuffle from the copy bank), date, info
   button -> metrics-explanation sheet; view-mode segmented picker: Week chart /
   7-Night Avg / Score / Core with 90D-vs-All toggle; Week mode has a 4-pill stat row
   above the chart (avg sleep, sleep cons., wake cons., accuracy); Score mode = sleep
   alignment card with 4 component bars (duration/timing/phase/consistency); Core
   mode = core score card with 2 (duration, consistency); last-night status card
   (duration, day-over-day %, streak flame pill); the big **Go to Sleep / Wake Up**
   toggle with its "Tap to start" caption; animated starfield with shooting stars +
   glowing moon; while a session is active the whole app renders grayscale.
2. **metrics tab** - range picker (30D/90D/1Y/All); sections: overview stat cards,
   highlights, duration momentum (daily bars + 7-night line, trend/median pills, and
   the **trends analysis table**: 3/7/14/30/90-day rows with average, change chip,
   mini sparkline), regularity (6-tile grid, "latest" pill row, rolling consistency
   chart, rolling 14-night components with an all/bedtime/wake/accuracy filter),
   recovery (cumulative sleep debt), behavior patterns (weekday averages, histogram),
   range-start/total-range footer tiles. charts support scrub/selection like
   `chartXSelection`. empty state for no data.
3. **logs tab** - list of valid sessions (day, start-end, duration badge); swipe to
   delete; tap to edit; toolbar + to add. editor opens as a sheet.
4. **log editor (sheet)** - wake-day date picker + **circular drag-the-moon-and-sun
   time picker**, live "goal match %", bedtime-crossing-midnight handled, haptics on
   drag.
5. **settings tab** - sleep goal (bedtime/wake native time pickers); appearance
   (2 night palettes + system/light/dark mode; light = sunset theme); wind-down
   reminder toggle + sleep hygiene
   tips screen; community links; (healthkit + data sections omitted per scope).
6. **onboarding (6 steps)** - welcome -> health & tracking overview -> sleep schedule
   (circular picker) -> notification permission -> finish. (apple-health connect and
   nfc steps dropped per scope; keep the flow's look and pacing.)
7. **live activity** - parity: progress toward sleep goal, elapsed/remaining, all
   dynamic island states, restore on relaunch. superpower: interactive wake-up button
   ending the session from the lock screen / island + a wind-down countdown state
   before bedtime.

## reference screenshots (visual ground truth)

13 screenshots of the original app, taken back to back on a physical iphone (dark
mode, twilight palette), live in `twilight-swift-ui-screenshots/`. they show every
major ui the port must reproduce, ideally with native components. use them alongside
the design-token tables; where a screenshot and this spec's prose disagree, the
screenshot wins.

| file | screen | what it shows |
|---|---|---|
| IMG_4796 | dashboard - Week mode | greeting + emoji, date, view-mode picker, 4 stat pills, week bar chart (dual axis; dashed rules: indigo bedtime 12:30 AM, orange wake 7:30 AM, gray 7.0h goal; day + duration x-labels), last-night card (streak flame 203, 6h 36min, -6%), Go to Sleep button + caption, tab bar |
| IMG_4797 | dashboard - 7-Night Avg + 90D | moving-average card: vs-7d-ago / vs-target / range pills, above/below-target area coloring, dashed target, selection footer (date, avg, vs target, vs 7d ago) |
| IMG_4798 | dashboard - Score mode | sleep alignment score 56: DAILY / TREND / MAIN DRAG / best-7d flame pills, green-orange bars + trend line + dashed 70 rule, selection footer, component bars duration 91 / timing 33 / phase 31 / consistency 83 |
| IMG_4799 | dashboard - Core mode + All | core sleep score 86: DAILY 88 / TREND 86 improving / MAIN DRAG consistency / flame 21 best-21d, components duration + consistency only |
| IMG_4802 | metrics - top | toolbar (timeline + info), title + description, range picker, Overview 6-tile grid (tracked nights, coverage, avg duration, goal hit rate, current/best streak), Highlights 4-tile grid (longest, shortest, total, debt/credit) |
| IMG_4803 | metrics - duration momentum | daily bars + 7-night moving-average line with subtitle copy, recent-trend + median pills, trends-analysis card top rows |
| IMG_4804 | metrics - trends + regularity | full trends analysis table (3/7/14/30/90-day: average, up/down change chip, sparkline per row), regularity 6-tile grid (regularity score, bedtime/wake consistency, schedule accuracy, social jetlag, debt/credit) |
| IMG_4805 | metrics - rolling consistency | 4 "latest" pills (bedtime 70%, wake 83%, accuracy 41%, rolling score 65%), rolling consistency chart (teal area/line, dashed 80 rule), rolling 14-night components card with filter (bedtime selected: single purple line + stat) |
| IMG_4806 | metrics - components + recovery | components filter = All: 3 stat tiles + tri-line chart (bedtime indigo, wake orange, accuracy green dashed) with legend; cumulative sleep debt/credit area chart to -24h with 0h dashed rule |
| IMG_4807 | metrics - behavior patterns | average sleep by day of week (purple weekend bars, per-day labels), weekday/weekend avg pills, duration distribution histogram with % annotations, footer tiles (range start, total data range 204 days) |
| IMG_4809 | logs | Sleep Logs large title, top-right + button, rows: day, start -> end, accent duration badge, hairline separators |
| IMG_4810 | log editor | Log Sleep sheet: Cancel pill, wake-day pill, goal-match card (100%, "Exactly on target", green), circular sleep-window picker (moon + sun knobs, orange arc, 18/12/6/12 markers, center duration + "Perfect amount!"), bedtime / wake-up summary cards, Save Sleep Log button |
| IMG_4811 | settings | Sleep Settings large title, support row ("Indie-built. Community-supported"), sleep goal card (bedtime/wake pills + "Goal: 7 hr" chip), NFC & QR shortcuts section (in the original; OUT of port scope per decisions), app appearance (display mode, theme color) |

port notes from this set:

- the go-to-sleep caption reads "Tap to start or scan your NFC tag to automatically
  start" - the port keeps "Tap to start" and drops the NFC clause (nfc is out of
  scope; log in DEVIATIONS.md). same for settings: the NFC & QR section is not
  ported.
- still to capture for judging (not in this set): live activity lock screen +
  dynamic island (physical device), sunset light theme, onboarding steps.

## design tokens and component specs (normative - extracted jul 16 from source)

paths relative to `Twilight/`. the theme module and components must match these values.

### palettes (`Utils/ThemeManager.swift`)

theme slots: backgroundGradient, cardBackground, textPrimary, textSecondary, accent,
success, warning, actionPrimary, actionSecondary. all gradients are 2-stop linear,
top -> bottom, even distribution. IMPORTANT: the palette picker offers only the two
night palettes (`.twilight`, `.amethyst`); **sunset is the light-mode theme**, chosen
via ThemeMode, not the palette picker. defaults: mode dark, palette twilight.

| slot | twilight (teal) | amethyst (purple) | sunset (light) |
|---|---|---|---|
| gradient start | #0a1520 | #0c1445 | #ff9966 |
| gradient end | #0f2a3d | #2c1e5e | #ff5e62 |
| cardBackground | #1a1a2e @ 0.85 | #1c2559 @ 0.8 | white @ 0.85 |
| textPrimary | white | white | #2d1b2e |
| textSecondary | #8b9dc3 | #a3b1d6 | #5c4b5e |
| accent | #00d4ff | #4f5bd5 | #2d1b2e |
| success | #00ff88 | #4cd964 | #34c759 |
| warning | #ff6b35 | #ffcc00 | #ff9500 |
| actionPrimary | #00b4d8 | #4f5bd5 | #2b1c40 |
| actionSecondary | #2a2a4a | #3d426b | white @ 0.5 |

### typography

system font only (sf pro; rn ios default matches). `.rounded` design is used
selectively on large numerics - map to sf pro rounded on ios:
- circular picker duration digits: 48 bold rounded; h/m units 24 medium rounded;
  hour markers 14/12 semibold rounded
- streak count 16 bold rounded; editor headings headline/20 semibold rounded
- dashboard: greeting largeTitle bold textPrimary; date subheadline textSecondary;
  go-to-sleep label title3 bold; last-night duration 34 bold; insight pills: title 10
  bold uppercased secondary, value 15 semibold, subtitle caption2
- metrics: SectionTitle = headline medium secondary; MultiStatCard title caption
  secondary, value title3 semibold, icon 20 semibold; ChartCard title subheadline
  semibold, subtitle caption secondary; MetricChip title caption, value headline

### signature components

**StarfieldView** (`Components/Common/StarfieldView.swift`): default 40 stars +
shooting stars. star: size rand 1.5-3.5, initial opacity rand 0.3-0.8, twinkle
duration rand 1.5-4.0s, delay rand 0-3.0s, easeInOut repeatForever autoreverse from
opacity 0.3 to initial; blur 0.5 when size > 2.5. shooting star: first at
0.05+rand(2-4)s, next every rand(4-7)s; start x rand 10-50% width, y rand top 25%;
travel x 150-250, y 100-180; duration rand 0.8-1.2s; fade-out from 70% progress;
trail = 8 circles, per-index progress lag 0.04, opacity (8-i)/10, size 4-i/3, blur
i*0.3; head 5x5 white, blur 0.5, white shadow r3.

**GlowingMoonView**: sf symbol `moon.stars.fill`, default #ffd700, size 80; 3 glow
layers (radius/opacity): 40/0.15, 25/0.25, 12/0.4; glowing state: blur r*1.5 vs
r*0.6, opacity *1.6 vs *0.5, scale 1.15 (icon 1.05); breathing easeInOut 3.0s
repeatForever autoreverse.

**card recipe** (repeated everywhere): `.padding(16)` -> thinMaterial background ->
cornerRadius 20 -> stroke overlay linear-gradient white 0.4 -> 0.1 (topLeading ->
bottomTrailing) lineWidth 1 -> shadow black 0.1, radius 10, y 5 -> horizontal
padding. **CardBackground** (large cards): cornerRadius 24, ultraThinMaterial 0.7,
gray 0.3 stroke lw1; inactive spotlight blob = accent 0.5 circle at (90% w, 50% h)
blur 15; active state = animated metaball aurora (5 blobs, speeds 0.18-0.32,
alphaThreshold 0.45, blur 28) - port with skia.

**buttons**: GlassButton - hstack spacing 6, icon 16 medium, title subheadline
semibold, vertical padding 12 (horizontal 24 unless fullWidth), thinMaterial
rounded 16, stroke color 0.2 lw1, press scale 0.96 spring(0.3), long-press 0.8s
fires medium haptic. RoundedButton - secondary 0.2 bg, gray text, subheadline
medium, padding 12/8, radius 16 continuous, ultraThinMaterial, white 0.15 stroke,
light haptic on tap. **go to sleep / wake up**: title3 bold white, full width,
default padding, cornerRadius 15; background = actionPrimary (go to sleep) /
warning (wake up); wrapped in the card recipe at radius 20.

**circular time picker** (`OnboardingCircularTimePicker.swift` - the ONLY one in
use; `CircularTimePickerBetter` in Views/Logs is dead code): size 280 (outer frame
+80). layers: outer glow ring angular-gradient purple/indigo lw50 blur 15 opacity
0.6; track linear white 0.08 -> 0.03 lw40; active arc lw40 angular gradient
#667eea -> #764ba2 -> #f093fb -> #f5576c -> #FFB347 (sleep angle -90 to wake angle
-90, split into two trims when crossing midnight), round caps, shadows purple 0.5
r10 + orange 0.3 r20; hour markers at 0/6/12/18 (14/12 semibold rounded, am/pm 8
medium, offset -(size/2+35)), ticks capsule white 0.15 w2 h8(every 3h)/h4 offset
-(size/2+8). knobs: moon #7B68EE (sleep), sun #FFB347 (wake), white-gradient
circle 52x52, icon 22 semibold, shadow color 0.4 r6 (r12 dragging) y2 + black 0.2
r4 y2, drag glow 64x64 blur 8, scale 1.15 dragging, spring(0.3, damping 0.7).
drag math: angle = atan2(dy,dx)*180/pi + 90 wrapped 0-360; grab threshold 35 deg,
nearest knob wins; snap 1.25 deg = 5 minutes; haptics light on grab + each snap,
medium on release. center: duration digits 48 bold rounded, label 13 medium,
status icon 12 + message 11 medium (healthy = success color at 7-9h); quality
copy: <6h "Add more sleep", 6-7 "Almost ideal", 7-9 "Perfect amount!", else
"Extra rest time". appear pulse easeInOut 2s repeatForever.

### charts (mark-level parity targets)

**dashboard week chart** (`SleepChartView.swift`): vertical BarMark per day
(yStart/yEnd = negative time offsets), width 25, accent @ 0.7, cornerRadius 4;
duration LineMark gray 0.3 lw3 catmullRom + gray PointMark symbolSize 30;
RuleMarks: optimal duration gray 0.8 dash [4,4] lw2 (caption2 bold annotation),
optimal sleep indigo dash [4,4] lw2, optimal wake orange dash [4,4] lw2; selection
rule white 0.3 lw2; dual y-axis (trailing time labels 12pt accent every 4h,
leading duration 0/4/8/12h 12pt bold gray, 31-min collision hiding); x labels =
day (12 bold) + duration (10 medium secondary); selection popover: radius 12
ultraThinMaterial, shadow black 0.2 r8 y3, white 0.3 stroke, deviation color
green <=15min / yellow <=31min / accent. height 300 (255 with insight pills).

**7-night avg card**: AreaMark segments colored by above/below target - green 0.22
/ red 0.22 (segments split at target crossings, interpolated); LineMark
actionPrimary lw3 catmullRom; target RuleMark gray 0.8 dash [4,4] lw1.2; selection
rule white 0.4 dash [2,3] + white PointMark symbolSize 56; y domain dynamic,
clamped 0-12h, min span 0.9, labels "%.1fh"; x-axis month().day() count 5; plot
clipped; height 220.

**alignment score card**: daily BarMark green 0.68 (score >= 70) else orange 0.65;
trend LineMark actionPrimary lw3 catmullRom (EMA 0.8 prev + 0.2 daily); target
RuleMark 70 green 0.65 dash [4,4] lw1.2; selection as above; y domain 0-100, axis
values [0,25,50,70,100]; height 220.

**metrics screen** (all in ChartCard, radius 24, ultraThinMaterial, minHeight 160):
duration momentum = BarMark green/orange by target r4 + 7-night LineMark
actionPrimary lw2.5 catmullRom + target rule, y 0-12; rolling consistency =
AreaMark teal 0.2 + LineMark teal lw3 catmullRom + rule 80 gray dash, selection
bubble + teal point 48; rolling components = 3 LineMarks lw2.8 linear (bedtime
indigo, wake orange, accuracy green dash [4,3]), "%" y-labels; sleep debt =
LineMark accent lw2.5 + AreaMark accent 0.18 + zero rule; weekday averages =
BarMark purple 0.8 (weekends) / actionPrimary 0.8, r4, y 0-12, custom day+avg
labels; histogram = BarMark accent 0.8 with % caption2 top annotations; timeline
sheet = horizontal BarMark (bed -> wake) height 10 actionPrimary 0.35 r3 +
indigo/orange PointMarks 24 + target rules dash [4,4] lw1.4. common x-axis:
automatic desiredCount 5, month().day().

### animations, haptics, layout

- fadeInSlide modifier: spring(response 0.4, damping 0.6) + delay; opacity 0 -> 1,
  offset y 30 -> 0 on appear (used across dashboard cards)
- grayscale-while-sleeping: `.grayscale(1.0)` on the app root, no explicit
  animation wrapper
- streak indicator explicitly disables animation on change
- haptics: light = rounded buttons, picker grab/snap; medium = glass long-press,
  picker release; success notification = break-glass only (out of scope)
- corner radius scale: 24 (large cards) / 20 (dashboard + chart cards) / 16
  (buttons) / 15 (sleep toggle) / 14 (metric chips) / 12 (pills, popovers) / 10
  (range toggles)
- spacing: dashboard vstack 16; metrics lazyvstack 20; card inner 12; pill rows 8;
  metrics scroll padding horizontal 20 / vertical 16
- every screen: zstack [ theme gradient ignoresSafeArea, starfield(40) ignores,
  scrollview content ]; lists hide scrollContentBackground and paint the gradient
- tab bar: STANDARD system tab bar, tinted accent - do not build a custom one
- sheets: metrics explanation detents [0.6, large] + drag indicator; timeline
  [0.82, large]; log editor = full sheet, inline title, gradient toolbar background

### copy banks (port verbatim into `src/copy/`)

- greetings (`Utils/SleepGreetings.swift`): 9 time-bucketed banks (early morning
  11, morning 5, afternoon 9, evening 12, night 11, hour-before-sleep 11,
  hour-after-wake 9, should-be-sleeping 9, currently-sleeping 9) with selection
  logic: sleeping -> sleeping bank; within 60min before bed -> before bank; within
  60min after wake -> after bank; inside sleep window -> should-be-sleeping; else
  time-of-day (5-9/9-12/12-17/17-20/else night)
- wind-down notifications: 10 messages, title "Wind Down Time 🌙", daily 3h before
  optimal sleep
- sub-5-minute jokes: 7 messages interpolating a pluralized time string ("Did you
  really have a N-minute sleep? 🤨")
- focus messages: 4 active, sleep-themed

## testing strategy

- **golden fixtures (the core of parity):** JSON session sets (regular sleeper, shift
  worker crossing midnight, timezone traveler, sub-5-min noise, gaps/streak breaks)
  with expected outputs for every metric above, derived from the swift implementation.
  jest runs the ts engine against them. any mismatch is a bug in the port, not the
  fixture.
- **unit tests:** session-rules (5-min, wake-day, canonical night, tz edge cases),
  formatters, store operations.
- **component tests:** @testing-library/react-native for editor logic (midnight
  crossover, goal match %) and list behaviors.
- **visual parity protocol:** per screen, same data seeded in both apps, side-by-side
  screenshots (simulator, same device class) reviewed against the originals in
  `twilight-swift-ui-screenshots/` (see reference screenshots section). fps
  overlay during animation checks.
- **e2e (stretch):** maestro flows - onboard, toggle session, add/edit/delete log.
- ci not required initially; `bun run test` + `bunx tsc --noEmit` green before every
  commit.

## port priorities (build order for the plan)

1. app builds, launches, navigates the 4 tabs.
2. core data model + sleep-logging flow end to end (toggle button, manual log editor,
   5-minute rule, wake-day attribution, timezone stored per session).
3. dashboard matches the original: layout, typography, spacing, starfield, theme,
   dark mode, button states, grayscale-while-asleep.
4. remaining screens ported: metrics, logs + editor (circular picker), settings,
   onboarding.
5. charts and statistics match the original's numbers and look (golden fixtures pass;
   visual parity per chart).
6. polish parity: animations, haptics, all 3 themes (2 palettes + sunset light),
   edge cases.
7. live activity: parity first (progress, elapsed/remaining, dynamic island states),
   then the superpower - interactive wake-up button + wind-down countdown state,
   shipped with expo-widgets in typescript.
8. bonus: the app boots and navigates on android from the same codebase. no polish
   expected; it existing at all is the point.

## risks and early spikes (do these before deep implementation)

1. **expo-widgets interactivity:** verify a live-activity button can end a session
   (button -> app intent -> js) on sdk 57. fallback: wind-down state + richer island
   content only.
2. **chart fidelity:** spike victory-native against the dashboard week chart + one
   scrubbed metrics chart. if it can't match swift charts' look, hand-roll with skia
   (more work, full control) - decide at spike, not mid-build.
3. **grayscale-while-asleep:** rn has no whole-tree grayscale filter. primary
   approach: theme-level desaturated palette swap + skia saturation(0) on canvas
   surfaces. stretch: tiny native module applying a UIView color filter. decide at
   spike.
4. **circular picker feel:** the drag-the-moon-and-sun picker is the app's signature
   interaction; prototype early with gesture-handler + skia + haptics and compare feel
   on device.

## boundaries

- **always:** treat the swift source as the truth for behavior and styling; verify
  claims against it before implementing; bun for everything; conventional commits,
  one per task; run tests + typecheck before each commit; note every intentional
  deviation from the original in a DEVIATIONS.md.
- **ask first:** adding native deps beyond the stack table; any visual deviation where
  rn cannot match the original; schema changes; touching the video prompt files.
- **never:** modify the swift app source or `twilight-rn/`; copy code from
  `twilight-rn/` (consult as reference only); touch the 9 contestant app dirs;
  commit secrets; publish/board-status changes without rami's go-ahead.

## success criteria

- [ ] port builds and runs on ios simulator + at least boots on android
- [ ] priorities 1-7 done; 8 attempted
- [ ] golden-fixture metric tests pass (numbers match the swift engine)
- [ ] side-by-side visual review passed per screen (rami approves each)
- [ ] live activity parity verified on a physical device; interactive wake-up button
      ends the session; wind-down state renders
- [ ] all 3 themes work (twilight/amethyst palettes + sunset via light mode,
      system/light/dark switching)
- [ ] timezone edge cases pass (midnight crossing, dst, travel fixture)
- [ ] DEVIATIONS.md lists every conscious difference from the original
- [ ] design-tokens section of this spec filled and matched by the theme module

## open questions

1. expo-widgets interactive buttons - spike result pending (risk 1).
2. chart library final call - spike result pending (risk 2).
3. onboarding: scope drops the apple-health and nfc steps; keep a 4-step flow or
   redesign the pacing? (proposal: 4 steps, same visual language.)
4. should the wind-down daily notification deep-link into starting wind-down mode
   (new behavior) or stay a plain reminder like the original?

## appendix: video test-3 artifacts (separate track)

this port pilots the migration story for the comparison video. the test-3 prompt
(`test-3-swift-rewrite.md`) still needs, from this spec: [APP_NAME] = Twilight,
[SWIFT_REPO_PATH] = sanitized reference copy, [FEATURE_LIST] = the screens section
above (condensed), [SCREENSHOTS] = list below. the prompt's live-activity "superpower"
claim must be corrected the same way this spec does (parity + interactive + wind-down).

**reference repo for contestants** - sanitized read-only copy, same path for everyone:

- copy `/Users/rami/Documents/code/swift/simple-sleep-tracker` ->
  `/Users/rami/Documents/code/swift/twilight-reference`
- **ignore:** `twilight-rn/` (finished port = contamination), `.git/` (history),
  `AGENTS.md` + `skills-lock.json` (agent instructions), `buildServer.json`, build
  artifacts
- **keep:** `Twilight/`, `TwilightWidget/` (live activity reference), extension
  targets, `twilight.xcodeproj`, `assets/`, `README.md`, `LICENSE`
- `chmod -R a-w`, path recorded in run-protocol's parity checklist

**screenshots:** CAPTURED (jul 16) - the 13-image set in
`twilight-swift-ui-screenshots/` covers dashboard (all 4 view modes), metrics (full
scroll), logs, editor, and settings; see the reference screenshots section for the
per-file map. still to capture for the prompt/judging: live activity lock screen +
dynamic island expanded (physical device), onboarding schedule step, sunset light
dashboard.

**run-protocol updates:** test-3 judging script walks the core flows side by side,
then live activity beat (passive vs interactive), then android boot as the closer;
rubric rows for live-activity parity, superpower, android bonus, honesty delta;
pre-flight adds the expo-widgets interactivity spike and one clean
`expo run:android` of the starter.
