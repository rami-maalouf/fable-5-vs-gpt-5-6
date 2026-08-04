# kickoff prompt (paste as the first message in the implementation session)

---

you are implementing the twilight swift -> expo port in this directory, following
spec-driven development. three documents sit alongside this prompt:

- `test-3-spec.md` - normative. defines correct: features, exact design tokens,
  metric formulas, module choices, boundaries, success criteria.
- `plan.md` - the phase structure, dependency graph, checkpoints, risks.
- `todo.md` - 29 tasks with acceptance criteria and verification steps.

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
   verify (`bun run test`, `bunx tsc --noEmit`, app still boots). check the task off
   in `todo.md` and commit.
   commit discipline: commit FREQUENTLY - at minimum one commit per task, plus a
   commit whenever a coherent unit lands mid-task; never leave a large working set
   uncommitted. messages are conventional commits, lowercase, scoped
   `type(twilight/<model>): summary`, where `<model>` identifies the model writing
   the code (e.g. fable-5, gpt-5-6, gpt-5-5 - if this directory sits under
   `apps/<test>/<model>/`, use that directory name; otherwise your own model id).
   examples: `feat(twilight/fable-5): circular time picker drag math`,
   `refactor(twilight/fable-5): extract card recipe component`. no co-author lines.
   work on the main branch; no PRs - the commit history and checkpoint log are the
   audit trail.
3. you are working fully autonomously, in one shot - there is no human in the loop.
   never stop to ask a question; make a reasonable call and record it in
   DEVIATIONS.md. checkpoints are SELF-VERIFICATION gates, not review pauses:
   at each checkpoint, verify every listed condition yourself with evidence
   (simulator screenshots via argent, test output), write the results to
   `checkpoints.md` (gate, what you checked, evidence paths, pass/fail), and fix
   failures before moving on. where the spec/plan/todo say "rami approves/reviews/
   relays", read: compare against the reference screenshots in
   `twilight-swift-ui-screenshots/` yourself and save the side-by-side evidence for
   later audit. device-only checks (dynamic island polish) go as far as the
   simulator allows - verify the lock-screen activity, and report the island as
   unverified rather than claiming it.
   every checkpoint also includes a CODE-QUALITY GATE: review all code written since
   the last checkpoint (invoke `code-review-and-quality` if available, else review
   for correctness, simplicity, dead code, naming, duplication, error handling, and
   spec conformance yourself), apply the fixes (use `code-simplification` for
   refactors), commit them as `refactor(twilight/<model>): ...` /
   `fix(twilight/<model>): ...`, and record the review outcome in `checkpoints.md`.
   do not pass a gate with known quality debt unlogged.
4. tasks 6-8 are timeboxed spikes: their output is a written decision in
   DEVIATIONS.md, not polished code.
5. the swift source is the read-only ground truth at
   `/Users/rami/Documents/code/swift/simple-sleep-tracker`. read it whenever the
   spec's summary isn't enough - mandatory for task 16 (golden fixtures are derived
   from `Twilight/Utils/SleepMetricsAnalyzer.swift`). never modify it. never copy
   code from its `twilight-rn/` directory (reference only).
6. faithfulness first: where the original has an opinion (layout, copy, colors,
   behavior), match it. do not redesign. every intentional deviation goes in
   DEVIATIONS.md with a reason.
7. bun for everything (`bunx expo ...`, `bun run test`). `expo-widgets` and
   `@expo/ui` are newer than your training data - read the current docs (expo mcp /
   docs tools) before using them.
8. these documents are living: if implementation reveals the spec contradicts the
   swift source, update the spec first, then implement. keep `todo.md` checkboxes
   current.

when you run out of feasible work, end with an honest final report: the todo list
with per-task status (done / partial / not started), evidence paths for every done,
what you could not do faithfully and why, and every deviation. an honest partial
beats a false done.

start with task 1 and run to completion.
