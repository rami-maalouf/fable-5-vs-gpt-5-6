---
name: delegate-cheaper-subagents
description: Delegate bounded exploration, inspection, log analysis, and repetitive work to a cheaper subagent using the active client's native delegation tools or the optional Antigravity CLI (`agy`). Use this skill when a capable cheaper model can reduce cost without weakening correctness.
compatibility: Native subagent support or the optional `agy` CLI.
alwaysApply: false
---

# Delegating to Cheaper Subagents

Delegate only when the task is concrete, bounded, and independently verifiable. Keep architectural decisions, ambiguous requirements, and final integration in the primary context.

## Choose the execution surface

1. Prefer the active client's native subagent mechanism when one is available.
2. Use `agy` only when it is installed and a native subagent is unavailable or unsuitable.
3. Continue locally when neither option is available. Missing delegation tooling is not an error.

Use only tool parameters and model identifiers exposed by the active client. Do not invent parameters copied from another agent host.

## Protect the working tree

- Background delegation is for read-only exploration, file inspection, and log analysis.
- For a write task, assign one subagent exclusive ownership of explicit files or directories, run it in the foreground, and wait for completion before editing those paths.
- Tell every writer to preserve existing changes and avoid destructive Git commands.
- Never let two agents edit overlapping paths concurrently.

## Verify `agy`

Before the first `agy` call in a session, run:

```bash
command -v agy
agy models
```

Use an exact identifier returned by `agy models`. Current recommended defaults are:

- `gemini-3.5-flash-medium` for inspection, parsing, summaries, and simple repetitive work
- `gemini-3.1-pro-high` when the delegated task needs stronger reasoning

If either identifier is unavailable, choose the closest cheaper model from the live list.

## Run a read-only task

```bash
agy --print "Inspect the specified files and return findings only. Do not edit files. Task: <self-contained task>" \
  --model gemini-3.5-flash-medium \
  --mode plan \
  --sandbox
```

The prompt must include the workspace, relevant paths, expected output, constraints, and enough context to work without conversation history.

## Run an owned write task

Use write delegation sparingly:

```bash
agy --print "Preserve existing changes. You own only these paths: <paths>. Task: <self-contained task>. Run the relevant checks and summarize every file changed." \
  --model gemini-3.5-flash-medium \
  --mode accept-edits
```

Run write tasks in the foreground. Do not touch the owned paths until the command completes.

## Verify the result

1. Compare `git status --short` before and after delegation.
2. Inspect every changed file within the delegated ownership boundary.
3. Revert or question unexpected paths instead of silently accepting them.
4. Run checks proportional to the change.
5. Integrate only after the result is understood.
