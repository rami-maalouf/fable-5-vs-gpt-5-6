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

Before another take:

```bash
bun run demo:reset
```

After recording:

```bash
bun run demo:stop
```

If Simulator does not show every booted device automatically, use **File > Open Simulator** and select each device prefixed with `YouTube -` once. Simulator remembers the device windows after that.
