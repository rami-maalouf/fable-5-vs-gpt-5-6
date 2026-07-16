# Grayscale-while-asleep spike

Decision: use generated desaturated theme variants for React Native content and a Skia luminance `ColorMatrix` for canvas content. Do not add a custom native root filter.

## Device result

The toggle demo was verified on an iPhone 17 simulator running iOS 27 with the Expo SDK 57 development client:

- Twilight and Amethyst both become fully achromatic through generated palette tokens.
- The Skia preview becomes achromatic through the same perceptual luminance coefficients.
- Toggling color, palette, and palette selection updates in one frame with no visible hitch.
- Text remains readable in both night palettes.
- Success and warning examples retain text labels and shape, so meaning does not depend on color.
- React Native's public `filter: [{ saturate: 0 }]` variant remains visibly colored on this iOS build.

## Why the native path is rejected

React Native 0.86 includes SwiftUI-backed implementations for grayscale and saturation in `RCTViewComponentView`, but those branches require `enableSwiftUIBasedFilters`. The stable feature flag default in the installed React Native source is false. The current [React Native View Style documentation](https://reactnative.dev/docs/0.84/view-style-props#filter) also limits iOS filters to brightness and opacity and notes the SwiftUI approach as future work.

Enabling or copying that experimental wrapper in a local native module would couple the app to React Native internals, add a second rendering container around the entire tree, and inherit root-filter clipping behavior. React Native documents that `filter` applies to descendants and implies `overflow: hidden`. That is a poor boundary for a screen-filling starfield, native tabs, modals, and future platform upgrades.

The palette approach uses supported Expo and React Native primitives, behaves the same on iOS and Android, keeps accessibility semantics unchanged, and leaves each Skia canvas responsible for its own pixels.

## Production contract

- Generate the two night-theme grayscale variants with `desaturateTheme`.
- Swap to the generated variant while a session is active.
- Apply the shared luminance matrix to each Skia canvas while active.
- Never communicate success, warning, or selection through color alone.
- Keep the original behavior of no explicit grayscale animation.

## Evidence

- `spikes/grayscale-while-asleep/evidence/palette-twilight.png`
- `spikes/grayscale-while-asleep/evidence/palette-amethyst.png`
- `spikes/grayscale-while-asleep/evidence/native-filter-amethyst.png`
- `tests/grayscale-spike.test.ts`

## Sources

- [React Native View filter documentation](https://reactnative.dev/docs/0.84/view-style-props#filter)
- [React Native Skia color filters](https://shopify.github.io/react-native-skia/docs/color-filters/)
- Installed React Native implementation:
  - `node_modules/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm`
  - `node_modules/react-native/ReactApple/RCTSwiftUI/RCTSwiftUIContainerView.swift`
  - `node_modules/react-native/ReactCommon/react/featureflags/ReactNativeFeatureFlagsDefaults.h`

The demo remains quarantined under `spikes/grayscale-while-asleep` and the unlinked `app/grayscale-spike.tsx` route.
