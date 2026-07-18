// default widget adapter for non-ios platforms (web server bundle, android).
// the home-screen widget is ios-only, so this is a no-op that deliberately
// imports no native modules. metro resolves widget.ios.ts on ios instead,
// keeping @expo/ui and expo-widgets out of the web/server bundle entirely.

export function publishRemainingCalories(
  _remaining: number,
  _progress: number,
): void {
  // no widget surface off ios
}
