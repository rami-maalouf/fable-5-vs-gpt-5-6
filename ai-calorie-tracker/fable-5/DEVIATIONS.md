# deviations

records where the implementation departs from `prompt/test-1-tasks/test-1-spec.md`,
with the contestant prompt as ground truth.

## 1. router root is `src/app/`, not `app/`

the starter keeps the Expo Router root at `src/app/` (standard `src` directory
convention). the prompt requires "`app/scan+api.ts` (Expo Router API route)"; the
equivalent route in this starter is `src/app/scan+api.ts`. same route, same URL
(`POST /scan`), different filesystem prefix. all spec paths under `app/` map to
`src/app/`.

## 2. `@openai/agents` was not preinstalled

the spec assumed the starter shipped with `@openai/agents`. it did not. installed
`@openai/agents@0.13.4` plus its `zod@^4` peer dependency. the prompt itself only
guarantees `expo-widgets` is preinstalled and instructs using `@openai/agents`, so
installing it is compliant.

## 3. `expo-haptics` added

not in the spec's install command, but the spec's visual/motion section requires
"haptics on capture and accept". `expo-haptics` is the supported Expo API for that.

## 4. lint and test tooling added

the starter had a `lint` script but no eslint installed, and no test runner.
added `eslint` + `eslint-config-expo` (flat config) and `jest` + `jest-expo` +
`@testing-library/react-native`, matching the spec's testing strategy. jest is
pinned to 29.x because jest-expo 57 is built on jest 29 internals.

## 5. concurrent sessions reset tracked files in this worktree

during implementation, an external process (another contestant session sharing
this git repo) repeatedly restored tracked files to HEAD and cleaned untracked
files. mitigation: commit immediately after each verified change so restores
become no-ops. some baseline work had to be recreated once.
