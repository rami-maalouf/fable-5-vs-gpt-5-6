# kickoff prompt (paste as the first message in the implementation session)

---

you are implementing Nova, an ai chat app (expo, full stack), in this directory,
following spec-driven development. three documents sit alongside this prompt:

- `test-2-spec.md` - normative. objective, architecture, data model, backend spec,
  interaction spec, boundaries, success criteria.
- `plan.md` - phase structure, dependency graph, checkpoints, risks.
- `todo.md` - 17 tasks with acceptance criteria and verification steps.

on conflict: spec > plan > todo. read all three fully before touching anything.

## skills

if the `incremental-implementation` and `test-driven-development` skills are
available in this project, invoke them now and follow them throughout; use
`debugging-and-error-recovery` when something breaks, and
`code-review-and-quality` (+ `code-simplification` for applying cleanups) at every
checkpoint as described below. if they are not installed, the rules below carry the
same discipline - follow them exactly.

## how to work

1. execute `todo.md` strictly top to bottom, one task at a time; respect the
   dependencies listed on each task.
2. per task: tests first where the task has testable logic, then implement, then
   verify (`bun run test`, `bunx tsc --noEmit`, app still boots). check the task
   off in `todo.md` and commit.
   commit discipline: commit FREQUENTLY - at minimum one commit per task, plus a
   commit whenever a coherent unit lands mid-task; never leave a large working set
   uncommitted. messages are conventional commits, lowercase, scoped
   `type(nova/<model>): summary`, where `<model>` identifies the model writing the
   code (e.g. fable-5, gpt-5-6, gpt-5-5 - if this directory sits under
   `apps/<test>/<model>/`, use that directory name; otherwise your own model id).
   examples: `feat(nova/fable-5): streaming chat hook with abort`,
   `fix(nova/fable-5): composer keyboard gap`. no co-author lines. work on the main
   branch; no PRs - the commit history and checkpoint log are the audit trail.
3. you are working fully autonomously, in one shot - there is no human in the loop.
   never stop to ask a question; make a reasonable call and record it in
   DEVIATIONS.md. checkpoints are SELF-VERIFICATION gates, not review pauses: at
   each checkpoint, verify every listed condition yourself with evidence (simulator
   screenshots via argent, test output, the judging-script steps), write the results
   to `checkpoints.md` (gate, what you checked, evidence paths, pass/fail), and fix
   failures before moving on. where the spec/plan/todo say "rami reviews/approves",
   read: verify it yourself and save the evidence for later audit. the riskiest work
   is task 3 (streaming backbone) - do not build past checkpoint 1 until streaming
   is proven end to end.
   every checkpoint also includes a CODE-QUALITY GATE: review all code written since
   the last checkpoint (invoke `code-review-and-quality` if available, else review
   for correctness, simplicity, dead code, naming, duplication, error handling, and
   spec conformance yourself), apply the fixes (use `code-simplification` for
   refactors), commit them as `refactor(nova/<model>): ...` /
   `fix(nova/<model>): ...`, and record the review outcome in `checkpoints.md`. do
   not pass a gate with known quality debt unlogged.
4. scope discipline: build exactly the spec's functional scope. no settings, no
   onboarding, no auth, no markdown rendering, no extra features.
5. `OPENAI_API_KEY` lives in `.env` and must never appear in client code, logs, or
   git (`.env` is gitignored - keep it that way; `.env.example` is the tracked,
   placeholder-only template). server logic only in `src/app/chat+api.ts`.
6. `expo/fetch` streaming, `@openai/agents`, and expo server output are newer than
   your training data - read the current docs (expo mcp / docs tools) before using
   them. verify, don't guess.
7. bun for everything (`bunx expo ...`, `bun run test`). run the app on the ios
   simulator (iphone pro class) and check your own work visually; fix what you
   find.
8. write the implementation yourself - reading docs and library sources is fine,
   copying from existing chat template repos is not.
9. these documents are living: if implementation reveals a spec gap, update the
   spec first, then implement. keep `todo.md` checkboxes and DEVIATIONS.md current.

when you run out of feasible work, end with an honest final report: the todo list
with per-task status (done / partial / not started), evidence paths for every done,
the definition-of-done checklist from the spec with evidence per item, and every
deviation. an honest partial beats a false done.

start with task 1 and run to completion.
