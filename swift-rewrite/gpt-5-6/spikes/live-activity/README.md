# Live Activity interaction spike

Decision: the direct wake button is not reliable enough to mutate a sleep session as specified. Ship the fallback: a richer read-only Live Activity with wind-down state, elapsed time, and deep-link entry into the app. Keep authoritative session start and end mutations inside the foreground app.

## What was verified

On 2026-07-16, the quarantined spike ran in an iPhone 17 simulator on iOS 27 with the Expo development client:

- JavaScript started a real ActivityKit Live Activity tied to a persisted SQLite sleep session.
- JavaScript updated the activity from `Sleep session active` to `Wind-down active`.
- The banner rendered on the lock screen with compact elapsed time and a wake action.
- JavaScript ended the activity and the persisted sleep session from the app. The Dynamic Island indicator disappeared immediately.
- The first widget build failed on the lock screen because a widget function closed over an imported constant. Replacing the widget-side target with a literal fixed the isolated widget runtime error.

The lock-screen permission sheet could not be activated through Argent because the iOS 27 SpringBoard accessibility tree was empty. Full Keyboard Access exposed a focus ring but injected activation keys did not dismiss the consent sheet. No coordinates were guessed. This limits the tap experiment, but it does not change the framework-level process boundary below.

## Why the direct mutation is rejected

The [Expo SDK 57 widgets documentation](https://docs.expo.dev/versions/v57.0.0/sdk/widgets/) supports starting, updating, listing, and ending Live Activities from JavaScript. The interactive SwiftUI button uses `LiveActivityUserInteraction` in the generated widget extension.

In `expo-widgets` 57.0.5, that intent only calls `WidgetsEvents.shared.sendNotification`. `WidgetsEvents` publishes through `NotificationCenter.default`, and `WidgetsModule` forwards the event to JavaScript only while its host-process observer is active. Unlike the normal widget intent path, the Live Activity intent does not execute an extension-side handler, update shared props, or persist a command for later reconciliation.

That means the wake button has no durable handoff when the app process is suspended or terminated. Ending a persisted session from that event would depend on app liveness, which violates the sleep-session invariant that an explicit wake action must be applied exactly once and survive process death.

## Chosen product path

- Use the Live Activity for elapsed time, wind-down state, status copy, and richer Dynamic Island content.
- Deep-link the activity to the active-session screen.
- End the session through the app, where SQLite remains authoritative.
- Revisit direct actions only if Expo adds an extension-side handler or a durable App Group event queue with stable activity identity and exactly-once reconciliation.

The runnable spike remains isolated under `spikes/live-activity` and the unlinked `app/live-activity-spike.tsx` route so later SDK versions can be retested without coupling production screens to the rejected interaction model.

## Production adoption

Task 27 promoted the read-only parity path into `widgets/SleepLiveActivity.tsx` and `src/services/live-activity.ts`. The production activity now starts and ends with the SQLite session lifecycle, displays system-updating elapsed and remaining timers, tracks the configured sleep goal, persists its identifier, adopts the native instance after relaunch, removes duplicates, and respects the iOS setting. The spike reexports the production widget so the extension registers one factory only.

Task 28 completed the fallback with a three-hour pre-bedtime state. Launch and foreground reconciliation calculate the next local bedtime, start or update one wind-down activity inside that window, and end it outside the window. The lock-screen banner and Dynamic Island variants now switch iconography, countdown labels, guidance, and progress by phase. The rejected wake button was not promoted into production because it still lacks a durable background handoff.
