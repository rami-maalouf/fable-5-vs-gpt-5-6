# chart approach spike

## decision

Use a hybrid approach for production charts:

- use `victory-native` `CartesianChart` for chart bounds, scales, gestures, and
  line interpolation.
- use custom Skia primitives for Swift-style details that need exact control:
  floating sleep-window bars, dashed target rules, custom dual-axis labels, and
  selection overlays.

This is preferable to pure Victory Native because the dashboard Week chart is not
a standard column chart. Its sleep-window bars float between bedtime and wake time,
while the duration trend line shares the same vertical space. Pure Victory bars
are baseline bars, so matching the original requires custom marks anyway.

This is preferable to fully hand-rolled Skia because Victory Native provides the
hard parts that should not be rebuilt during feature work: scale construction,
chart bounds, Catmull-Rom line path rendering, press state, and gesture plumbing.

## verified in the spike

- the sample chart renders from the same seven-night values shown in `IMG_4796`.
- the chart uses 25pt floating sleep-window bars, a Catmull-Rom duration line,
  points, dashed rules for 12:30 AM, 7:30 AM, and 7.0h, dual-axis labels, and
  day plus duration x-labels.
- `useChartPressState` drives a selected-day footer and vertical selection rule.
- pure mapping helpers are covered by Jest so the unusual clock-to-chart domain is
  explicit and reusable.

## evidence

- simulator screenshot after scrub selection:
  `spikes/chart-approach/evidence/week-chart-spike-selected.png`
- reference screenshot:
  `prompt/test-3-tasks/twilight-swift-ui-screenshots/IMG_4796.PNG`

## production guidance

- keep a small chart-domain helper module separate from visual components.
- render exact chart labels outside Victory axes unless production fonts are wired
  into Skia. The default axis label path is less faithful without an explicit
  Skia font.
- keep bars and rulemarks custom Skia marks. Do not force them through Victory
  `Bar` if the chart needs floating range bars.
- use Victory Native for line, area, scatter, transforms, and scrub state unless a
  future chart requires unsupported mark geometry.

## sources

- Victory Native docs snippets for `CartesianChart`, `Line`, custom bars, and
  `useChartPressState`: https://commerce.nearform.com/open-source/victory-native/
- installed package declarations:
  - `node_modules/victory-native/dist/cartesian/CartesianChart.d.ts`
  - `node_modules/victory-native/dist/cartesian/components/Bar.d.ts`
  - `node_modules/victory-native/dist/cartesian/components/Line.d.ts`
  - `node_modules/victory-native/dist/cartesian/hooks/useChartPressState.d.ts`
  - `node_modules/victory-native/dist/types.d.ts`
- reference screenshot: `prompt/test-3-tasks/twilight-swift-ui-screenshots/IMG_4796.PNG`
