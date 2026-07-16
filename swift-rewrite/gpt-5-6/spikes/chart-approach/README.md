# Dashboard week chart spike

Decision: use a Victory Native plus custom Skia hybrid for production charts.

## Why this boundary works

Victory Native should own chart bounds, scales, Catmull-Rom paths, press-state matching, and gesture plumbing. Custom Skia marks should own the Swift-specific geometry: 25-point floating sleep-window bars, dashed rule lines, selection rules, and any mark that does not share a conventional zero baseline. React Native text overlays should own the dual-axis and two-line x-axis labels until chart fonts are loaded directly into Skia.

Pure Victory is not a good fit because the Week chart is not a conventional bar chart. Each bar spans bedtime to wake time while the duration line uses the same 0 to 12 drawing domain. Custom range bars are simpler and more faithful than coercing baseline bars.

Fully hand-rolled Skia would duplicate scale, interpolation, nearest-point selection, and gesture behavior that Victory already provides. Keeping those invariants in Victory leaves the custom layer small and deterministic.

## Device verification

Verified on an iPhone 17 simulator running iOS 27:

- Seven 25-point floating bars match the reference values and use 4-point corners.
- The duration line uses Victory's Catmull-Rom curve and custom point marks.
- The 12:30 AM, 7:30 AM, and 7.0h dashed rules render with separate colors.
- Leading duration labels, trailing clock labels, and day plus duration labels remain readable without collisions.
- A normal horizontal drag selects the nearest day, moves the vertical rule, and updates the detail footer.
- Disabling the native stack back gesture prevents horizontal chart scrubs from dismissing the route.
- Setting chart press activation to 0 ms produces immediate scrub response. The seven-point chart showed no visible dropped frames.

The full-screen pixel diff against `IMG_4796.PNG` reports 28.51% changed pixels. This is expected because the spike intentionally renders only its own header and chart card instead of the complete dashboard. Mark order, proportions, data, colors, and interaction are close enough to approve the hybrid boundary. Production task 18 still owns exact card placement, typography, annotations, popover styling, and full-dashboard pixel parity.

## Evidence

- Selected-state screenshot: `spikes/chart-approach/evidence/week-chart-spike-selected.png`
- Swift reference: `prompt/test-3-tasks/twilight-swift-ui-screenshots/IMG_4796.PNG`
- Pure chart-domain tests: `tests/chart-spike.test.ts`

## Sources

- [Victory Native project and documentation](https://github.com/FormidableLabs/victory-native-xl)
- [Maintainer-confirmed double-axis limitation](https://github.com/FormidableLabs/victory-native-xl/issues/254)
- Installed package contracts:
  - `node_modules/victory-native/dist/cartesian/CartesianChart.d.ts`
  - `node_modules/victory-native/dist/cartesian/components/Line.d.ts`
  - `node_modules/victory-native/dist/cartesian/hooks/useChartPressState.d.ts`
  - `node_modules/victory-native/src/cartesian/CartesianChart.tsx`

The runnable spike remains quarantined under `spikes/chart-approach` and the unlinked `app/chart-spike.tsx` route.
