# deviations and judgment calls

every non-obvious call made while implementing nova, in order. spec > plan > todo
on conflict; the contestant prompt (`spec.md`) is functional ground truth.

## 1. authoritative task docs synced into `tasks/`

the repo shipped with an older 14-task `tasks/plan.md` + `tasks/todo.md`
generation. the kickoff prompt names the 17-task set living next to it
(`prompt/test-2-tasks/{test-2-spec.md,plan.md,todo.md}`) as the documents to
execute. synced those three into `tasks/` (replacing the stale plan/todo) so
checkbox updates are committed as the audit trail. `spec.md` at the repo root
(the contestant prompt) left untouched as ground truth.
