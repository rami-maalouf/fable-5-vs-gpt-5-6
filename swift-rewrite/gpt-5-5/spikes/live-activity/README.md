# live activity spike

## decision

`expo-widgets` is feasible for the Twilight live-activity path on iOS dev builds.
Proceed with this approach for the later production implementation, with two
constraints:

- keep the widget component body self-contained and avoid imported helper
  functions inside the `'widget'` closure.
- keep any React Native control surface dev-only until the real sleep-session
  service owns start, update, and end.

## verified

- official Expo SDK 57 docs confirm `expo-widgets` is iOS-only, unavailable in
  Expo Go, and supports live activities through `createLiveActivity`.
- the local debug build created the widget extension and ran the Expo widgets
  bundle build step.
- the app can start and end a `TwilightLiveActivitySpike` from React Native.
- the iOS simulator lock screen rendered the live activity with Twilight copy,
  progress, and a `Wake Up` button.
- stale broken live activities can survive code changes until explicitly ended,
  so development verification must end existing instances before retesting.

## interaction finding

The installed package has interactive-button plumbing:

- `@expo/ui/swift-ui` `Button` accepts a `target`.
- Expo Widgets native code emits `LiveActivityUserInteraction(source, target)`.
- React Native can subscribe through `addUserInteractionListener`.

The spike includes that button path and an app-side listener that ends the
activity when `target === 'wake-up'`.

The simulator showed the first-run system prompt, `Allow Live Activities from
Twilight?`, over the rendered activity. Argent accessibility discovery did not
expose that prompt or the lock-screen button as tappable elements, and
`xcrun simctl privacy` does not include a Live Activities service that can be
pre-granted. Because of that automation limitation, the visual button render and
compiled listener path are verified, but a lock-screen button tap was not
completed in this environment.

## sources

- Expo SDK 57 widgets docs: https://docs.expo.dev/versions/v57.0.0/sdk/widgets/
- installed package inspection:
  - `node_modules/expo-widgets/src/Widgets.ts`
  - `node_modules/expo-widgets/src/Widgets.types.ts`
  - `node_modules/expo-widgets/ios/Widgets/AppIntent.swift`
  - `node_modules/expo-widgets/ios/Widgets/Buttons.swift`
  - `node_modules/expo-widgets/ios/Widgets/WidgetLiveActivity.swift`
