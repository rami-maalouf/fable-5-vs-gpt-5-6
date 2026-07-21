# AI Model Usage & Cost Comparison

Here is the detailed breakdown of token usage, message counts, active time, and
cost for all three apps built from the ground up in the three contestant
workspaces (`Fable 5`, `GPT-5.5`, and `GPT-5.6-Sol`).

## Overall Statistics by App and Model

| App | Model | Messages | Tokens In | Tokens Out | Cache Read | Cache Write | Total Tokens | Active Time | Cost |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **AI Calorie Tracker** | Fable 5* | 1,061 | 499,103 | 670,109 | 200,712,487 | 5,067,696 | 206,949,395 | 3h 44m 43s | $276.95 |
| **AI Calorie Tracker** | GPT-5.5 | 1,512 | 8,325,553 | 436,780 | 196,661,248 | 0 | 205,423,581 | 5h 20m 01s | $157.23 |
| **AI Calorie Tracker** | GPT-5.6-Sol | 1,724 | 8,119,116 | 513,163 | 216,630,272 | 0 | 225,262,551 | 5h 17m 22s | $170.16 |
| **AI Chat App** | Fable 5 | 396 | 93,452 | 239,083 | 134,515,693 | 1,073,582 | 135,921,810 | 1h 59m 56s | $160.82 |
| **AI Chat App** | GPT-5.5 | 1,311 | 6,219,109 | 351,619 | 167,120,512 | 0 | 173,691,240 | 4h 25m 59s | $128.29 |
| **AI Chat App** | GPT-5.6-Sol | 1,175 | 4,733,913 | 301,251 | 179,648,768 | 0 | 184,683,932 | 3h 23m 57s | $125.50 |
| **Swift Rewrite** | Fable 5* | 773 | 225,676 | 524,009 | 320,633,189 | 16,867,113 | 338,249,987 | 3h 24m 48s | $558.83 |
| **Swift Rewrite** | GPT-5.5 | 1,539 | 6,481,539 | 550,526 | 214,963,328 | 0 | 221,995,393 | 5h 47m 58s | $160.65 |
| **Swift Rewrite** | GPT-5.6-Sol | 2,439 | 12,835,139 | 789,385 | 319,726,848 | 0 | 333,351,372 | 13h 34m 09s | $254.50 |

\* The `fable-5` contestant folders are not model-pure. AI Calorie Tracker
contains 110 Opus 4.8 messages, including the final two active turns. Swift
Rewrite contains 8 Opus 4.8 messages from a separate session. Their tokens and
costs remain included because this report is workspace-scoped.

---

## App Summaries (Totals)

### AI Calorie Tracker

- **Total Messages**: 4,297
- **Total Tokens**: 637,635,527
- **Total Active Time**: 14h 22m 06s
- **Total Cost**: $604.35

### AI Chat App

- **Total Messages**: 2,882
- **Total Tokens**: 494,296,982
- **Total Active Time**: 9h 49m 52s
- **Total Cost**: $414.62

### Swift Rewrite

- **Total Messages**: 4,751
- **Total Tokens**: 893,596,752
- **Total Active Time**: 22h 46m 55s
- **Total Cost**: $973.98

---

## Model Summaries (Totals across all 3 apps)

### Fable 5*

- **Total Messages**: 2,230
- **Total Tokens**: 681,121,192
- **Total Active Time**: 9h 09m 27s
- **Total Cost**: $996.61

### GPT-5.5

- **Total Messages**: 4,362
- **Total Tokens**: 601,110,214
- **Total Active Time**: 15h 33m 58s
- **Total Cost**: $446.17

### GPT-5.6-Sol

- **Total Messages**: 5,338
- **Total Tokens**: 743,297,855
- **Total Active Time**: 22h 15m 28s
- **Total Cost**: $550.17

---

## Validation and Timing Method

- Usage and cost were independently reproduced with `bunx tokscale@latest`
  using the July 16-18 date range and `workspace,model` grouping.
- Claude token classes were cross-checked per session with
  `bunx ccusage@latest claude session --breakdown --json`.
- Costs retain Tokscale's full precision for summaries and are rounded only
  when displayed. The validated grand total is **$1,992.94**.
- Active time is goal-scoped. Codex values come from
  `~/.codex/goals_1.sqlite` (`time_used_seconds`); Claude values are the sum of
  root-session `turn_duration` events.
- Active time excludes overnight pauses and time between manual resumptions.
  It is not the same as end-to-end calendar time.
