# checkpoints: nova - ai chat app

## checkpoint 1 - shell, streaming backbone, runtime decision

status: pass

checked:
- task 1 shell boots on iOS simulator with header and empty chat surface.
- task 2 domain and SQLite repository tests pass, including cascade delete and ordering.
- task 3 `/chat` API route validates model allowlist, keeps `OPENAI_API_KEY` server-only, and streams plain text from the Expo API route to the native debug view.
- code-quality gate reviewed code written since kickoff for correctness, simplicity, dead code, naming, duplication, error handling, and spec conformance. no unlogged quality debt found.

evidence:
- `bun run test`: 18 tests passed after task 3.
- `bunx tsc --noEmit`: clean after task 3.
- `bunx expo lint`: clean after task 3.
- direct route probe: `POST http://localhost:8097/chat` returned `200` and streamed text.
- simulator manual stream screenshot: `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-0PYRLq/media/218789000-1784196243219.png`.
- empty shell screenshot before streaming: `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-0PYRLq/media/539519000-1784196033539.png`.

runtime decision:
- `@openai/agents@0.13.4` worked in the Expo API route runtime. no fallback to the plain OpenAI SDK was used, so no `DEVIATIONS.md` entry was required for task 3.

## task 14 - scroll anchoring verification

status: pass

checked:
- auto-follow stays active while new assistant content arrives and the transcript is already at the bottom.
- manual transcript dragging disengages auto-follow and shows a floating `scroll to latest message` control.
- new streamed chunks do not yank the viewport back to the newest text while detached.
- tapping `scroll to latest message` jumps to the latest content and hides the floating control.
- code-quality gate reviewed the task 14 diff for correctness, simplicity, naming, dead code, duplication, error handling, and spec conformance. no unlogged quality debt found.

evidence:
- `bun run test`: 56 tests passed after task 14.
- `bunx tsc --noEmit`: clean after task 14.
- `bunx expo lint`: clean after task 14.
- simulator detached mid-stream screenshot: `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-BIHsU3/media/558074000-1784238333558.png`.
- simulator jump-to-latest screenshot: `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-BIHsU3/media/397672000-1784238476397.png`.

tracking note:
- `todo.md` already had tasks 14 through 17 checked before this task 14 implementation was audited. task 14 is now supported by code and evidence. tasks 15 through 17 were reset to unchecked because they are not yet supported by checkpoint evidence in this run.

## task 15 - animation and launch polish verification

status: pass

checked:
- message send and assistant appear paths use native Reanimated entrance/layout animations.
- streaming assistant text grows with layout animation and did not overlap or clip during the simulator sweep.
- drawer open and close timing was split into faster native-feeling open and close configs.
- status bar uses animated automatic styling and the native root background is set from the active theme to prevent launch-color mismatch.
- cold dev-client launch into a fresh chat had no visible layout flash or unreadable status bar state.
- composer action controls and model picker hit targets are covered by 44pt component assertions; model picker rows also reported 44pt in the native accessibility tree.
- manual Perf Monitor sweep showed the settled chat view at UI 60 / JS 60, and the drawer edge-drag returned to smooth settled state after one transient JS dip during drag.
- code-quality gate reviewed the task 15 diff for correctness, simplicity, naming, dead code, duplication, error handling, and spec conformance. no unlogged quality debt found.

evidence:
- `bun run test`: 60 tests passed after task 15.
- `bunx tsc --noEmit`: clean after task 15.
- `bunx expo lint`: clean after task 15.
- cold launch / empty chat screenshot: `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-do4w1J/media/40314000-1784239336040.png`.
- message send and completed assistant response screenshot: `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-do4w1J/media/972895000-1784239367973.png`.
- drawer open screenshot: `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-do4w1J/media/6928000-1784239380007.png`.
- Perf Monitor drawer sweep screenshot: `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-do4w1J/media/636727000-1784239485637.png`.
- JS runtime log registry: `/Users/rami/.argent/tmp/argent-logs-8097-1784239418636.log` reported 0 captured entries.

notes:
- `xcrun simctl io <udid> shake` is not available on this iOS 27 simulator runtime; Metro's `m` shortcut opened the React Native Dev Menu and enabled Show Perf Monitor instead.

## task 16 - light/dark and empty-state verification

status: pass

checked:
- light and dark mode live-switched mid-session with `xcrun simctl ui 705C1405-E555-4C11-840D-A874D16FA712 appearance dark` without restarting the app.
- empty state is intentional in both schemes: branded title, concise guidance copy, themed root background, and no saved-chat content leaked into the main surface.
- drawer, dim overlay, search field, selected row state, user bubbles, assistant text, input chrome, and inline error state were visually checked in both schemes.
- user bubble foreground/background contrast is covered by a token test; the light accent was darkened so white bubble text reaches WCAG AA contrast.
- Expo SDK 57 app config is covered by a config test for `userInterfaceStyle: automatic`, `expo-system-ui`, and light/dark splash backgrounds.
- closed drawer accessibility was audited in the simulator; hidden conversation rows were initially exposed by AX, then fixed with native `accessibilityElementsHidden` coverage and reverified with `describe`.
- code-quality gate reviewed the task 16 diff for correctness, simplicity, naming, dead code, duplication, error handling, and spec conformance. no unlogged quality debt found.

evidence:
- `bun run test`: 64 tests passed after task 16.
- `bunx tsc --noEmit`: clean after task 16.
- `bunx expo lint`: clean after task 16.
- light empty screenshot: `prompt/test-2-tasks/evidence/task-16/light-empty.png`.
- light drawer screenshot: `prompt/test-2-tasks/evidence/task-16/light-drawer.png`.
- light conversation screenshot: `prompt/test-2-tasks/evidence/task-16/light-conversation.png`.
- light error screenshot: `prompt/test-2-tasks/evidence/task-16/light-error.png`.
- dark empty screenshot: `prompt/test-2-tasks/evidence/task-16/dark-empty.png`.
- dark drawer screenshot: `prompt/test-2-tasks/evidence/task-16/dark-drawer.png`.
- dark conversation screenshot: `prompt/test-2-tasks/evidence/task-16/dark-conversation.png`.
- dark error screenshot: `prompt/test-2-tasks/evidence/task-16/dark-error.png`.

notes:
- Expo docs note that development builds may not fully reproduce every splash-screen property. This task verifies the SDK 57 config contract in tests and the live root/background surfaces in the dev client, not a production release splash recording.

## task 17 - definition-of-done sweep

status: pass

checked:
- all 13 contestant-prompt definition-of-done items were walked with screenshot, log, route-probe, or prior task evidence.
- the 5-step judging script was run manually on the iOS simulator: fresh launch and first stream, long reply scroll and stop, error plus retry, drawer search/jump/rename/delete, model switch plus relaunch persistence.
- startup and post-relaunch JS runtime log registry reported 0 captured entries.
- direct backend route probe rejected `gpt-4.1` with HTTP 400 and `{"error":"unsupported model"}`.
- code-quality gate reviewed the task 17 diff for correctness, simplicity, naming, dead code, duplication, error handling, and spec conformance. no unlogged quality debt found.

evidence:
- final verification summary: `prompt/test-2-tasks/verification/task-17-summary.md`.
- stable screenshots: `prompt/test-2-tasks/evidence/task-17/01-startup-empty.png` through `prompt/test-2-tasks/evidence/task-17/16-relaunch-thread-persistence.png`.
- `bun run test`: 18 suites and 65 tests passed after task 17.
- `bunx tsc --noEmit`: clean after task 17.
- `bunx expo lint`: clean after task 17.
- JS runtime log registry: `/Users/rami/.argent/tmp/argent-logs-8097-1784242202894.log` reported 0 captured entries.

notes:
- During final judging, a long assistant message visually clipped in the native text layout even though the accessibility tree contained the full reply. `MessageRow` now renders assistant text as a memoized plain `Text` node with explicit wrapping constraints, and the message-list test covers the unconstrained wrapping text node.
- Error-state verification used a killed Metro connection, which matches the prompt's allowed "kill network or key" failure path.
