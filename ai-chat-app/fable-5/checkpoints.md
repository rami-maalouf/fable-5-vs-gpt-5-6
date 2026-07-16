# checkpoint log

self-verification gates from `tasks/plan.md`. each entry: gate, what was
checked, evidence paths, pass/fail, and the code-quality-gate outcome.

## checkpoint 1 - foundation + streaming backbone (tasks 1-3) - PASS

date: 2026-07-16 ~03:55. device: iphone 17 pro (ios 26.5,
udid B47A3DF3-056A-4531-B9FA-8327C7C8A485), dev server on port 8123 (see
DEVIATIONS.md #0 for the shared-machine port/device story).

checked:

1. shell boots via `bunx expo run:ios` build (native build succeeded, 0 errors
   0 warnings; installed + launched; header "Nova" + empty state renders).
   evidence: verification/checkpoint-1-shell-empty-state-light.png
2. unit tests green: 33/33 across domain (title truncation, search, allowlist),
   data repos (round-trip, cascade delete, updated_at ordering), route contract
   (400 off-list/malformed, streamed text, history passthrough). `bunx tsc
   --noEmit` clean.
3. streaming proven e2e on the REAL route with the REAL @openai/agents sdk:
   - server: curl of all three allowlisted models returned live streamed
     replies; invalid model returned 400 (verified against MY server after
     discovering the port-8090 server belonged to another contestant - see
     DEVIATIONS.md #0)
   - chunking: node client measured 36 discrete chunks over the wire for one
     short reply (token-level granularity)
   - on-device: debug harness streamed "hey nova, introduce yourself" reply
     into the view incrementally; outcome complete. evidence:
     verification/checkpoint-1-streamed-reply-complete.png (+ second-run shot)
4. runtime decision recorded: @openai/agents RUNS in the expo api-route
   runtime. no fallback to plain openai sdk needed.
5. api key never reaches the client: fetched the full 9MB ios client bundle
   from the dev server; 0 occurrences of the key value, of "OPENAI_API_KEY",
   and of the server-only Nova instructions string.

code-quality gate: reviewed all code since start (layout, theme tokens, domain,
data repos, route, stream hook, debug harness). findings: duplicate expo-router
import in _layout.tsx (fixed inline); debug harness in index.tsx is temporary
by design (replaced in tasks 4-5); no dead code, naming consistent, error
handling covers abort vs failure vs http-error paths. no known quality debt
carried forward.

known deviations logged: expo/fetch relative-url resolution workaround
(DEVIATIONS.md #5).
