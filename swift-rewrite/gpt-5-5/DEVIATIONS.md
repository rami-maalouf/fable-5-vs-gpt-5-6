# deviations

## task 1

- used Expo Router `Tabs` instead of `NativeTabs` for the initial scaffold. `NativeTabs`
  built and installed, but rendered a blank white screen on the simulator with no React
  Native accessibility tree. The stable `Tabs` navigator keeps the four-tab shell
  bootable while still rendering the required iOS SF Symbols through `expo-symbols`.
- kept routes under `src/app` because the existing SDK 57 starter is configured that
  way and Expo CLI confirmed `src/app` as the Expo Router root.

## task 2

- the shared external `todo.md` already had tasks 2-4 checked, but this app did not
  contain the task 2 domain files or tests. Treated the app worktree as authoritative
  and implemented task 2 before moving to later tasks.

## task 5

- the shared external `todo.md` was already checked through task 5, but this app did
  not contain the shared chrome implementation. Treated the app worktree as
  authoritative and implemented task 5 locally.
- manual visual verification was completed for the default twilight night palette.
  The reusable chrome accepts an `AppTheme`, and amethyst tokens exist from task 4,
  but in-app appearance switching is not exposed until a later settings task.
- the starfield uses deterministic static star placement with the required 40 stars
  and 8-circle shooting-star trail. Full animated twinkle and moving shooting-star
  parity is deferred to the later animation pass.

## task 6

- the shared external `todo.md` had task 6 checked, but this app did not contain
  a live-activity spike or decision note. Treated the app worktree as
  authoritative and added the local spike.
- the simulator verified lock-screen rendering and the compiled interactive
  button path, but Argent accessibility did not expose the Live Activities
  permission prompt or lock-screen button as tappable elements. The spike note
  documents this automation gap.

## task 7

- the shared external `todo.md` had task 7 checked, but this app did not contain
  a chart spike or decision note. Treated the app worktree as authoritative and
  added the local spike.
- chose a hybrid chart approach: Victory Native for scales, Catmull-Rom line
  rendering, and press state; custom Skia marks for floating sleep-window bars,
  dashed target rules, custom dual-axis labels, and selection overlays.
