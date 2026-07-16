# Deviations

Every intentional difference from the Swift Twilight source is recorded here.

## Foundation

- The Expo port uses `studio.orbitlabs.twilight.expo` for its iOS bundle identifier and Android package. The `.expo` suffix lets the port coexist with the production Swift app during side-by-side testing.
- The onboarding flow will use four steps: welcome, sleep schedule, notification permission, and finish. This follows the plan and todo resolution after HealthKit and NFC were removed from scope, despite an older six-step reference in the spec screen summary.
