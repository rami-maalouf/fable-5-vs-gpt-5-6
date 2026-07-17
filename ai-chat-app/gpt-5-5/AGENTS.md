# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.


## Token Budget & Agent Cost Rules

To keep context small and costs low, observe these rules during UI builds:
1. **Prefer Text over Pixels:** Use `describe` or `debugger-component-tree` to verify state. Only use `screenshot` when a check is strictly visual (spacing, color, clipping).
2. **Minimize Screenshot Weight:** The system is configured with `ARGENT_SCREENSHOT_SCALE=0.2`. Use `includeImageInContext: false` when capturing baselines just for diffing.
3. **Run Sequences:** Use `run-sequence` for multi-step actions instead of tapping and screenshotting repeatedly. Use `await-ui-element` to wait for state to settle.
4. **One Session Per Checkpoint:** Use `checkpoints.md` as the handoff artifact. Start fresh sessions per checkpoint to avoid dragging the whole build history along.
5. **Delegate Exploration:** Use subagents to explore and dump files, returning only the conclusion to the main context.
