// lock-screen button targets. must match the literal `target` values in
// widgets/sleep-activity.tsx (the 'widget' compiler inlines them there).
// kept in a plain module so android never evaluates the widget module,
// whose createLiveActivity() call requires the ios-only native factory.
export const WAKE_UP_TARGET = 'wake-up';
export const START_SLEEP_TARGET = 'start-sleep';
