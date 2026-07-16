# Nova

Nova is a production-focused Expo SDK 57 chat app for iOS with one native-feeling chat surface and a ChatGPT-style conversation drawer. It streams real OpenAI Agents SDK responses through the Expo Router `/chat` API route, supports stop and retry, follows long responses without fighting manual scrolling, and keeps conversations in client-side SQLite.

The app includes first-message titles, newest-first history, title and content search, rename and destructive delete, fresh unsaved chats, and per-conversation Luna, Sol, or Terra selection. The composer supports multiline entry, interactive keyboard dismissal, send haptics, loading, partial-response recovery, and light or dark appearance changes without relaunching.

## Judgment Calls

- Native requests resolve the relative `/chat` contract against the Expo development host because native networking has no browser origin.
- Explicit measured bottom-follow state replaces `maintainVisibleContentPosition`, which does not fit a growing final row.
- Stream bytes accumulate immediately for exact persistence while UI commits are batched every 40 ms and flushed on success, stop, or error.
- The drawer uses Reanimated and Gesture Handler so leading-edge drags track the finger and settle by velocity or position.
- Native iOS action sheets present conversation actions and model choices; rename uses a small cross-platform text-entry modal.
- Launch always starts a fresh unsaved chat while persisted history remains available through the drawer.

The complete rationale is in `DEVIATIONS.md`.

## Verification

- Definition of done: `verification/DOD.md`
- Streaming and stop: `verification/14-intro-stream-complete-light.png`, `verification/14-scrollup-midstream-light.png`, `verification/14-stop-partial-light.png`
- Keyboard and safe areas: `verification/05-keyboard-attached-light.png`, `verification/05-landscape-keyboard-light.png`, `verification/13-keyboard-dark.png`
- Persistence and history: `verification/08-persistence-relaunch.json`, `verification/10-two-conversations-light.png`, `verification/10-restored-conversation-light.png`
- Conversation management: `verification/11-rename-search-light.png`, `verification/11-active-delete-light.png`
- Models: `verification/12-model-picker-light.png`, `verification/12-sol-conversation-light.png`, `verification/12-terra-conversation-light.png`
- Appearance and launch: `verification/13-empty-light.png`, `verification/13-empty-dark.png`, `verification/13-conversation-dark.png`, `verification/13-compiled-app-icon.png`
- Error recovery: `verification/06-offline-error-light.png`, `verification/06-midstream-error-light.png`, `verification/06-error-dark.png`

No settings, onboarding, authentication, markdown rendering, server-side database, or additional endpoint was added.
