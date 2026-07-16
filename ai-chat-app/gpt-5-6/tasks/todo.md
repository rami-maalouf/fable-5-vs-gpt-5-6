# todo: ai chat app (fully fledged)

plan: `plan.md` - task details, acceptance criteria, and verification live there.

## phase 1: walking skeleton
- [x] task 1: project setup (deps, server output, strip starter scaffolding)
- [x] task 2: streaming api route with model allowlist
- [x] task 3: walking skeleton - send, stream, render, stop
- [x] checkpoint: e2e streaming works; typecheck + lint clean; commit

## phase 2: native-feel chat screen
- [x] task 4: message list feel (bubbles, scroll anchoring, empty state)
- [x] task 5: composer + keyboard (interactive dismiss, send/stop swap, haptic)
- [x] task 6: loading + error + retry
- [x] checkpoint: verification scenarios 1-3 pass; commit

## phase 3: persistence
- [x] task 7: sqlite layer (schema, migrations, queries)
- [x] task 8: wire chat to sqlite (titles, partial-on-stop, relaunch restore)
- [x] checkpoint: relaunch restores history; commit

## phase 4: drawer + conversation management
- [x] task 9: drawer shell (edge swipe, dim overlay, header button)
- [x] task 10: conversation list + new chat + titles
- [x] task 11: rename, delete, search
- [x] checkpoint: verification scenario 4 passes; commit

## phase 5: model picker + polish
- [x] task 12: model picker (per-conversation, allowlist)
- [ ] task 13: polish audit (light/dark, launch, animations, safe areas)
- [ ] task 14: final DoD verification + summary
- [ ] checkpoint: full definition of done green, evidence captured
