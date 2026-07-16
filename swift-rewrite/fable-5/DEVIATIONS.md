# deviations from the original swift app

every intentional difference between this port and the swift source, with reasons.
spec-sanctioned scope cuts are listed first; implementation-time deviations follow.

## scope cuts (pre-agreed in test-3-spec.md)

- app blocking (FamilyControls/ManagedSettings), healthkit sync, NFC/QR flows,
  storekit tip jar, telemetrydeck, BGTaskScheduler, demo-data manager, data
  export/archive, app intents/shortcuts/control-center widget, break-glass flow,
  session breaks: all out of scope per the spec's decisions section.
- go-to-sleep caption keeps "Tap to start" and drops the "or scan your NFC tag..."
  clause (nfc out of scope).
- settings: NFC & QR shortcuts section not ported (out of scope).
- onboarding reduced from 6 steps to 4 (welcome -> schedule -> notifications ->
  finish); apple-health and nfc steps dropped per scope.

## implementation deviations

- routes live in `src/app/` (not root `app/`): the provided expo sdk 57 starter is
  configured for `src/app` and expo-router resolves it natively; keeping it avoids
  churn. all other structure follows the spec (`src/domain`, `src/data`, etc.).
- app identity: bundle id `com.rami.twilight.port` (fresh port id, not the original
  app's), scheme `twilight` kept per spec.
