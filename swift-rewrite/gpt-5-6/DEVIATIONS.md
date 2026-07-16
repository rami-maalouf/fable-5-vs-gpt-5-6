# Deviations

Every intentional difference from the Swift Twilight source is recorded here.

## Foundation

- The Expo port uses `studio.orbitlabs.twilight.expo` for its iOS bundle identifier and Android package. The `.expo` suffix lets the port coexist with the production Swift app during side-by-side testing.
- The onboarding flow will use four steps: welcome, sleep schedule, notification permission, and finish. This follows the plan and todo resolution after HealthKit and NFC were removed from scope, despite an older six-step reference in the spec screen summary.
- Task 3 files were consumed by concurrent shared-repository commit `3eaa554` after they were staged. The scoped follow-up commit records task completion without rewriting or disturbing the other model's history.

## Polish

- The circular time picker keeps the written parity requirement's two-second arc pulse. The Swift source declares `showPulse` but does not apply it, while the task explicitly requires the pulse.
- Animation profiling used the iPhone 17 iOS 27 simulator because a physical device was not connected. Before and after the parity corrections, the metrics chart scrub recorded 21 React commits, all below 16 ms, zero hot commits, and zero native UI hangs. Reanimated animation-frame work remained 22 ms in aggregate in both native traces. The post-change React and native recordings completed together, but Argent's combined-report cache did not retain the React commits after analysis, so the two successful reports were compared directly.
- Haptic assignments were verified through the interaction source and simulator UI behavior. Physical haptic strength cannot be felt or distinguished in the iOS simulator.
- The supplied source and specification include the exact wind-down title, message count, timing, and onboarding preview body, but not the other nine Swift message strings. The Expo copy bank preserves the exact title and preview body, then supplies nine original messages in the same concise, warm tone.

## Live Activity

- Expo Widgets exposes a public ActivityKit instance list but does not expose each instance identifier on its TypeScript wrapper. Twilight reads the identifier from Expo SDK 57's native activity wrapper at one isolated service boundary so it can persist, adopt, and deduplicate activities across relaunches. SQLite remains the source of truth, and reconciliation repairs this projection if the SDK wrapper changes or an activity disappears.
- Simulator verification covered session start, live timer updates, wake-up removal, setting disable and re-enable, force-quit relaunch, and duplicate prevention. Dynamic Island layouts still require the queued physical-device checkpoint because the simulator used for this pass cannot prove hardware presentation behavior.
