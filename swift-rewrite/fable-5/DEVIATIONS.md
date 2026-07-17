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

- circular picker "appear pulse" (easeInOut 2s repeatForever): the swift source
  sets a showPulse state that is never read by any view - dead code with no
  visible effect. the port omits it rather than inventing a visual.
- community link icons use sf symbols instead of the original's bundled brand
  pngs (Discord/LinkedIn/Instagram imagesets); links and copy are verbatim.
- support row ("Indie-built. Community-supported") is visual-only: the tip jar
  it opened is out of scope (storekit).
- metrics footer tile "Profile ID" is replaced by a "Tag: Sleep" tile - the
  port has no BlockedProfiles entity (app blocking out of scope).
- 60fps check (task 25) was assessed qualitatively on the simulator (smooth
  starfield/scrub in captures + interaction); no instrumented fps overlay was
  run - simulator fps is not representative of device performance anyway.
- live activity (tasks 27/28): lock-screen behavior fully verified on the
  simulator (start on session start, elapsed/progress/remaining timers, wake up
  button ends the session from the lock screen, start sleep button starts one,
  relaunch restore, wind-down countdown within 3h of bedtime). dynamic island
  compact/minimal/expanded layouts are implemented but UNVERIFIED: they render
  only on island hardware and this run had no physical device. reported as
  unverified per the kickoff rather than claimed.
- wind-down live activity lifecycle hardening beyond the original: the countdown
  id encodes its bedtime so a changed bedtime replaces the activity, and an
  expired/out-of-window countdown is cleared on foreground (the original's
  ActivityKit flow has no equivalent state to leak).
- android (task 29, boot scope only - the original is ios-only): live activities
  are guarded to no-op off ios; the compact inline date/time picker does not
  exist on android (a mounted picker opens its modal dialog immediately), so
  settings and the log editor render a pressable value chip there that opens
  the system dialog on demand - ios keeps the native compact style. the glowing
  moon renders without its halo on android (the glow is built from ios shadow
  layers). no further android polish, per spec.
