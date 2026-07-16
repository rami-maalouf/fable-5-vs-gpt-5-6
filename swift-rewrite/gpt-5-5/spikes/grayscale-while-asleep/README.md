# grayscale while asleep spike

## decision

Use a desaturated theme palette while a sleep session is active, plus an explicit
Skia grayscale color matrix for Skia canvases.

Do not build a native root color-filter module for the initial port. The app's
current visible surfaces are React Native views plus Skia canvases. A native root
filter would add platform-specific surface interception, app-store risk, and
debuggability cost for an effect that can be represented through existing theme
and canvas boundaries.

## comparison

### palette swap plus skia matrix

- works in Expo without a custom native module.
- keeps all text, cards, buttons, gradients, and chart colors under the existing
  theme contract.
- keeps Skia surfaces faithful by applying the same sleep state through a 4x5 luma
  color matrix.
- preserves accessibility because text remains real text, not a filtered bitmap.

### native root color filter

- would better match SwiftUI `.grayscale(1.0)` as a whole-tree post-process.
- requires custom native code and platform-specific view/layer behavior.
- is harder to reason about for screenshots, blur, system materials, and future
  Android support.

## verified in the spike

- generated desaturated variants for twilight and amethyst night palettes.
- added Jest coverage for hex luma conversion, alpha preservation, and the Skia
  grayscale matrix.
- added a dev-only Settings toggle demo that switches React Native theme colors and
  Skia canvas saturation together.

## evidence

- simulator screenshot after toggling asleep:
  `spikes/grayscale-while-asleep/evidence/grayscale-asleep-demo.png`

## production guidance

- move `desaturateTheme` into `src/theme` in task 11.
- expose `useEffectiveTheme({ sleeping })` or equivalent so the sleep session
  state selects the desaturated night palette without changing stored user
  preferences.
- pass `sleeping` to Skia surfaces and wrap their canvas groups in
  `ColorMatrix matrix={grayscaleMatrix}`.
- keep sunset/light mode out of the grayscale palette set unless the product later
  allows sleep mode in light appearance. Task 8 only needs both night palettes.
