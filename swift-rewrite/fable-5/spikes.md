# spike decisions (phase 2, jul 16)

timeboxed risk burn-down per plan.md. each spike ends in a decision, not polish.

## spike 1 (task 6): expo-widgets live activity - DECIDED: superpower feasible as specced

verified on iPhone 17e simulator (iOS 27, udid 624A675C), expo-widgets 57.0.5:

- start/update/end from js work (`createLiveActivity` factory; `getInstances()`
  finds live instances after the js context restarts - good for relaunch restore).
- lock screen renders the activity: title row, auto-updating elapsed timer
  (`Text date/dateStyle="timer"`), progress toward goal
  (`ProgressView timerInterval countsDown={false}` - same mechanism as the swift
  `ProgressView(timerInterval:)`), remaining countdown text.
- **interactive wake-up button works end to end**: `<Button target="wake-up">` in
  the layout compiles to a native `LiveActivityIntent`; tapping it on the lock
  screen fires `addUserInteractionListener` in js (event.source = activity
  instance id, event.target = the button target) while the app is backgrounded,
  and js can end the activity + mutate the session. evidence/task-06/*.png.

constraints learned (bind task 27/28):

- the `'widget'` directive compiler captures ONLY the component function body -
  module-scope constants (colors, targets) must be inlined inside the function or
  the extension js runtime throws ReferenceError at render.
- `event.source` is the activity instance uuid, not the declared name - match on
  target, not source.
- first start triggers an "Allow Live Activities" prompt; a second "continue to
  allow" prompt appears at the lock screen. plan for both in QA.
- after ending + restarting activities rapidly, the lock screen sometimes does
  not re-display the new activity immediately (instance is alive per
  getInstances). re-verify update visibility during task 27; not a feasibility
  blocker.
- cold-start edge: if the app process is dead, the intent launches it in the
  background; the js listener may attach after the event. task 28 must reconcile
  on launch (active session + no activity button event = check timestamps).

decision: build task 27 (parity) + task 28 (interactive wake-up + wind-down
state) as specced. no fallback needed.

## spike 2 (task 7): chart approach - pending

## spike 3 (task 8): grayscale-while-asleep - pending
