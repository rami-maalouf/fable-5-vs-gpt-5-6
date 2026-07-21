#!/usr/bin/env python3

import argparse
import json
import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


@dataclass(frozen=True)
class Run:
    app: str
    model: str
    active_seconds: float
    elapsed_seconds: float
    started_at: datetime
    finished_at: datetime
    source: str
    model_mix: tuple[str, ...] = ()


def parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def format_duration(seconds: float) -> str:
    total = round(seconds)
    hours, remainder = divmod(total, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours}h {minutes:02d}m {seconds:02d}s"


def display_name(value: str) -> str:
    names = {
        "ai-calorie-tracker": "AI Calorie Tracker",
        "ai-chat-app": "AI Chat App",
        "swift-rewrite": "Swift Rewrite",
        "fable-5": "Fable 5",
        "gpt-5-5": "GPT-5.5",
        "gpt-5-6": "GPT-5.6-Sol",
    }
    return names.get(value, value)


def model_directories(workspace: Path) -> dict[Path, tuple[str, str]]:
    result = {}
    for app_dir in workspace.iterdir():
        if not app_dir.is_dir() or app_dir.name.startswith("_") or app_dir.name.startswith("."):
            continue
        for model_dir in app_dir.iterdir():
            if model_dir.is_dir() and model_dir.name in {"fable-5", "gpt-5-5", "gpt-5-6"}:
                result[model_dir.resolve()] = (display_name(app_dir.name), display_name(model_dir.name))
    return result


def read_codex_session_meta(path: Path) -> dict | None:
    with path.open(errors="replace") as handle:
        for _ in range(20):
            line = handle.readline()
            if not line:
                break
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(row, dict) and row.get("type") == "session_meta":
                return row.get("payload") or {}
    return None


def codex_runs(codex_home: Path, directories: dict[Path, tuple[str, str]]) -> list[Run]:
    session_paths = {}
    sessions_root = codex_home / "sessions"
    if sessions_root.exists():
        for path in sessions_root.rglob("*.jsonl"):
            meta = read_codex_session_meta(path)
            if not meta:
                continue
            try:
                cwd = Path(meta.get("cwd", "")).resolve()
            except OSError:
                continue
            if cwd in directories:
                session_paths[meta.get("id")] = cwd

    database = codex_home / "goals_1.sqlite"
    if not database.exists():
        return []

    runs = []
    connection = sqlite3.connect(f"file:{database}?mode=ro", uri=True)
    try:
        rows = connection.execute(
            """
            select thread_id, time_used_seconds, created_at_ms, updated_at_ms
            from thread_goals
            where status = 'complete'
            """
        )
        for thread_id, active, created_ms, updated_ms in rows:
            cwd = session_paths.get(thread_id)
            if cwd not in directories:
                continue
            app, model = directories[cwd]
            started = datetime.fromtimestamp(created_ms / 1000, tz=timezone.utc)
            finished = datetime.fromtimestamp(updated_ms / 1000, tz=timezone.utc)
            runs.append(
                Run(
                    app=app,
                    model=model,
                    active_seconds=active,
                    elapsed_seconds=(finished - started).total_seconds(),
                    started_at=started,
                    finished_at=finished,
                    source="codex goal ledger",
                )
            )
    finally:
        connection.close()
    return runs


def text_content(row: dict) -> str:
    message = row.get("message") or {}
    content = message.get("content") if isinstance(message, dict) else None
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(
            item.get("text", "")
            for item in content
            if isinstance(item, dict) and item.get("type") == "text"
        )
    return ""


def read_claude_run(path: Path, app: str, model: str) -> Run | None:
    goal_started = None
    last_model = None
    durations = []
    with path.open(errors="replace") as handle:
        for line in handle:
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if not isinstance(row, dict):
                continue
            if row.get("type") == "user" and "<command-name>/goal</command-name>" in text_content(row):
                goal_started = parse_timestamp(row["timestamp"])
            message = row.get("message") or {}
            if row.get("type") == "assistant" and isinstance(message, dict):
                candidate = message.get("model")
                if candidate and candidate != "<synthetic>":
                    last_model = candidate
            if row.get("type") == "system" and row.get("subtype") == "turn_duration" and goal_started:
                durations.append((parse_timestamp(row["timestamp"]), row.get("durationMs", 0) / 1000, last_model))

    if not goal_started or not durations:
        return None
    finished = durations[-1][0]
    model_mix = tuple(sorted({item[2] for item in durations if item[2]}))
    return Run(
        app=app,
        model=model,
        active_seconds=sum(item[1] for item in durations),
        elapsed_seconds=(finished - goal_started).total_seconds(),
        started_at=goal_started,
        finished_at=finished,
        source="claude turn durations",
        model_mix=model_mix,
    )


def claude_runs(claude_projects: Path, directories: dict[Path, tuple[str, str]]) -> list[Run]:
    runs = []
    for directory, (app, model) in directories.items():
        if directory.name != "fable-5":
            continue
        project_key = str(directory).replace("/", "-")
        project_dir = claude_projects / project_key
        if not project_dir.exists():
            continue
        candidates = []
        for path in project_dir.glob("*.jsonl"):
            run = read_claude_run(path, app, model)
            if run:
                candidates.append(run)
        if candidates:
            runs.append(max(candidates, key=lambda run: run.finished_at))
    return runs


def render(runs: list[Run]) -> str:
    order = {"Fable 5": 0, "GPT-5.5": 1, "GPT-5.6-Sol": 2}
    runs.sort(key=lambda run: (run.app, order.get(run.model, 99)))
    lines = [
        "| App | Model | Recorded active | End-to-end elapsed |",
        "| :--- | :--- | ---: | ---: |",
    ]
    for run in runs:
        lines.append(
            f"| {run.app} | {run.model} | {format_duration(run.active_seconds)} | "
            f"{format_duration(run.elapsed_seconds)} |"
        )
    mixed = [run for run in runs if len(run.model_mix) > 1]
    if mixed:
        lines.append("")
        for run in mixed:
            lines.append(
                f"Warning: {run.app} / {run.model} contains multiple recorded models: "
                f"{', '.join(run.model_mix)}."
            )
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract benchmark durations from local goal and session records.")
    parser.add_argument("workspace", nargs="?", type=Path, default=Path.cwd())
    parser.add_argument(
        "--codex-home",
        type=Path,
        default=Path(os.environ.get("CODEX_HOME", Path.home() / ".codex")),
    )
    parser.add_argument(
        "--claude-projects",
        type=Path,
        default=Path.home() / ".claude" / "projects",
    )
    args = parser.parse_args()
    workspace = args.workspace.resolve()
    directories = model_directories(workspace)
    runs = codex_runs(args.codex_home.expanduser(), directories)
    runs.extend(claude_runs(args.claude_projects.expanduser(), directories))
    print(render(runs))


if __name__ == "__main__":
    main()
