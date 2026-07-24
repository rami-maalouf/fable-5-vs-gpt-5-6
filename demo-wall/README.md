# Nine-app recording wall

The recording wall runs the three app concepts across the three model variants on nine separate iPhone 17 Pro simulators. Demo builds use local, deterministic content and never require an AI request during a take.

## First setup

```bash
bun run demo:doctor
bun run demo:setup
```

Setup creates nine dedicated simulator devices and builds each app in Release mode with `EXPO_PUBLIC_DEMO_MODE=1`. The first build is intentionally sequential for reliable Xcode output.

Setup reuses completed builds if it is interrupted. To rebuild every app after changing demo code, run:

```bash
DEMO_WALL_REBUILD=1 bun run demo:setup
```

## Recording

```bash
bun run demo:start
```

Use a 4K OBS canvas. Add each Simulator device as a window source and place the devices in this 3x3 order:

| | Fable 5 | GPT-5.5 | GPT-5.6 |
|---|---|---|---|
| Nourish | top left | top center | top right |
| Nova | middle left | middle center | middle right |
| Twilight | bottom left | bottom center | bottom right |

## Window layouts

A layout is a saved arrangement of the nine windows: which apps are shown (with size + position) and which are minimized. Save as many as you want and switch between them.

```bash
# arrange the windows you want on screen, minimize the rest, then capture it
bun run demo:save-layout           # saves as "default"
bun run demo:save-layout calorie   # a named layout (e.g. the three Nourish apps)

# re-apply a saved arrangement
bun run demo:apply-layout          # applies "default"
bun run demo:apply-layout calorie

# list what's saved
bun run demo:layouts
```

`demo:start` applies the `default` layout automatically after booting all nine. Layouts are JSON in `demo-wall/layouts/` (git-tracked, keyed by app id).

### How a layout is stored

Each of the nine apps is one entry. A shown app has a `size` and a top-left `x`/`y`; a hidden app has `"hidden": true`.

```json
{ "id": "nourish-gpt-5-5", "label": "Nourish - GPT-5.5", "size": "fit", "x": 28, "y": 28 }
{ "id": "nova-fable-5", "label": "Nova - Fable 5", "hidden": true }
```

`size` is one of Simulator's window presets, because Simulator only resizes through its own Window menu (pixel-precise resizing is ignored):

| `size` | Window menu item | approx. on a 1920x1080 display |
|---|---|---|
| `fit` | Fit Screen | 491 x 1041 (full height) |
| `point` | Point Accurate | 456 x 972 |
| `physical` | Physical Size | 380 x 843 |
| `pixel` | Pixel Accurate | 1368 x 2792 (huge) |

Two more sizing options instead of `size`:

- `"maxSize": "physical"` - a cap. Resize to the preset **only if the window is currently wider than it**; leave smaller windows alone. `default` uses this to shrink any oversized window back to ~380px without enlarging the small 9-up wall. (Note: "Physical Size" is inches-based, so it renders ~380px on the 1920x1080 display and smaller on a Retina panel - either way it stays at or below the cap.)
- omit both `size` and `maxSize` to never touch the window's size at all.

### Requirements and caveats

- Grant your terminal/editor **Accessibility** access (System Settings > Privacy & Security > Accessibility). Layouts use it to focus, size, position, and minimize windows.
- Do everything on **one display**. If "Displays have separate Spaces" is on (System Settings > Desktop & Dock), AppleScript can only see windows on the currently-active Space, so keep all nine simulators on the recording display and don't scatter them across monitors, or hiding/positioning becomes unreliable.
- **Position** is reproduced exactly; **size** snaps to the nearest preset above (a few pixels off any hand-dragged size).

To make sure every app is open without disturbing ones already running:

```bash
bun run demo:open-apps
```

This launches each app on its simulator only if it is not already running (unlike `demo:reset`, which relaunches all nine into their deterministic scenes).

Before another take:

```bash
bun run demo:reset
```

After recording:

```bash
bun run demo:stop
```

If Simulator does not show every booted device automatically, use **File > Open Simulator** and select each device prefixed with `YouTube -` once. Simulator remembers the device windows after that.
