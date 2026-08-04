# Fable 5 vs GPT-5.6: one-shotting three iPhone apps

Three AI models. Three real apps each. The same spec-driven prompt every time, and zero human coding. This repo is everything behind the experiment: the specs, the nine resulting codebases, and the receipts.

## Watch the video first

[![Fable 5 vs GPT-5.6 - the video](https://img.youtube.com/vi/SLWl53sizHs/maxresdefault.jpg)](https://youtu.be/SLWl53sizHs)

**https://youtu.be/SLWl53sizHs**

This repo is the companion to that video. Everything shown on screen lives here.

## The experiment in numbers

| | total |
|---|---|
| money spent | $1,992.94 |
| tokens burnt | 2.03 billion |
| messages exchanged | 11,930 |
| active build time | ~47 hours |

The contestants:

- **Fable 5** (Claude Code)
- **GPT-5.6 Sol** (Codex)
- **GPT-5.5** (Codex), as a control

All three models ran on high effort, with the same prompt, the same starter template, and the same tools.

The tests:

1. **AI calorie tracker** - camera + vision AI, Cal AI as the design bar
2. **AI chat app** - streaming chat, the ChatGPT iOS app as the design bar
3. **Swift rewrite** - a full one-shot port of [Twilight](https://apps.apple.com/ca/app/twilight-simple-sleep-tracker/id6757098758) (a real SwiftUI sleep tracker) to Expo + React Native

Full interactive metrics dashboard: **https://rami-maalouf.github.io/fable-5-vs-gpt-5-6/**

## Repo map

### The specs (what the models were told to build)

| path | what it is |
|---|---|
| [`specs/ai-calorie-tracker/`](specs/ai-calorie-tracker) | spec, implementation plan, and per-task todo checklist for test 1 |
| [`specs/ai-chat-app/`](specs/ai-chat-app) | same trio (plus the kickoff prompt) for test 2 |
| [`specs/swift-rewrite/`](specs/swift-rewrite) | same for test 3, plus the original Twilight SwiftUI screenshots the models ported from |

Each spec was generated with the [spec-driven development skill](https://github.com/addyosmani/agent-skills/blob/main/skills/spec-driven-development/SKILL.md). The plan breaks the spec into implementation tasks, and every task had to clear a standing bar (including on-simulator validation of each feature) before it could be committed. That verification loop is what made clean one-shots possible, and also where most of the 2 billion tokens went.

### The nine builds (what the models produced)

| path | what it is |
|---|---|
| [`ai-calorie-tracker/`](ai-calorie-tracker) | test 1 builds: [`fable-5/`](ai-calorie-tracker/fable-5), [`gpt-5-5/`](ai-calorie-tracker/gpt-5-5), [`gpt-5-6/`](ai-calorie-tracker/gpt-5-6), plus `demo-media/` (the food photos used in the scan tests) |
| [`ai-chat-app/`](ai-chat-app) | test 2 builds, same three-model layout |
| [`swift-rewrite/`](swift-rewrite) | test 3 builds, same three-model layout |
| [`_starter/`](_starter) | the pinned Expo SDK 57 template every contestant started from: same deps, same agent configs, same skills, same MCP setup. This is the level playing field |

Every build is untouched model output. No human commits, no cleanup.

### The receipts (how the builds were measured)

| path | what it is |
|---|---|
| [`usage_report.md`](usage_report.md) | cost, tokens, messages, and active time per app per model, validated with tokscale and ccusage. The $1,992.94 grand total lives here |
| [`code-quality-report.md`](code-quality-report.md) | independent code-quality audit of all nine repos (health scores, tech debt, per-repo findings), scored with the [code-quality-scoring skill](https://github.com/bobmatnyc/claude-mpm-skills/tree/main/universal/quality/code-quality-scoring) |
| [`usage-report.html`](usage-report.html) | the interactive dashboard, deployed to [GitHub Pages](https://rami-maalouf.github.io/fable-5-vs-gpt-5-6/) on every push |
| [`measure_code_lines.ts`](measure_code_lines.ts) | the script that counted lines of code per build |
| [`extract_durations.py`](extract_durations.py) | the script that pulled active build time from the Claude/Codex session databases |

### The filming rig (how the video was recorded)

| path | what it is |
|---|---|
| [`demo-wall/`](demo-wall) | runs all nine apps on nine iPhone simulators at once, in a 3x3 wall, for the side-by-side shots. See its [README](demo-wall/README.md) |
| [`demo-mode.sh`](demo-mode.sh) | toggles demo mode across the apps: canned deterministic data instead of live AI calls, so takes are repeatable |

## Running the apps

Each build is a standalone Expo app. From any build folder (for example `ai-chat-app/fable-5/`):

```bash
bun install
cp .env.example .env   # add your OPENAI_API_KEY
bun start
```

The calorie tracker and chat app backends are Expo [API routes](https://docs.expo.dev/router/reference/api-routes/) calling the [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/), so the only secret you need is an OpenAI key. No key? Run `./demo-mode.sh on` to switch the apps to canned data.

## The verdict (spoilers)

Fable 5 won on code quality, UI quality, speed, and code size on all three apps, and cost roughly double. GPT-5.6 Sol won on cost efficiency and never gave up (13.5 hours on the Swift rewrite). GPT-5.5 shipped the worst tech debt in every test. The full reasoning is in [the video](https://youtu.be/SLWl53sizHs), and every number behind it is in the reports above.

## Links

- the video: https://youtu.be/SLWl53sizHs
- the dashboard: https://rami-maalouf.github.io/fable-5-vs-gpt-5-6/
- spec-driven development skill: https://github.com/addyosmani/agent-skills/blob/main/skills/spec-driven-development/SKILL.md
- code quality scoring skill: https://github.com/bobmatnyc/claude-mpm-skills/tree/main/universal/quality/code-quality-scoring
- Expo API routes: https://docs.expo.dev/router/reference/api-routes/
- OpenAI Agents SDK (JS): https://openai.github.io/openai-agents-js/
- Argent (the simulator validation tool the models used): https://argent.swmansion.com/
- Twilight, the SwiftUI app that got ported: https://apps.apple.com/ca/app/twilight-simple-sleep-tracker/id6757098758
