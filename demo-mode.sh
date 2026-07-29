#!/usr/bin/env bash
# toggle demo mode across all contestant apps that have it (calorie tracker + chat app).
# demo mode = EXPO_PUBLIC_DEMO_MODE=1 -> canned data, no real AI calls.
# real mode  = EXPO_PUBLIC_DEMO_MODE=0 -> photos hit /scan, chats hit /chat (needs valid
#              OPENAI_API_KEY in each .env and the dev server running).
#
# usage:
#   ./demo-mode.sh off      # deactivate demo mode everywhere (default)
#   ./demo-mode.sh on       # reactivate demo mode everywhere
#   ./demo-mode.sh status   # show current state per app
#
# note: EXPO_PUBLIC_* vars are inlined at bundle time. after toggling, restart the
# dev server with a cleared cache: bun start -- -c   (or: npx expo start -c)

set -euo pipefail

cd "$(dirname "$0")"

APPS=(
  ai-calorie-tracker/fable-5
  ai-calorie-tracker/gpt-5-6
  ai-calorie-tracker/gpt-5-5
  ai-chat-app/fable-5
  ai-chat-app/gpt-5-6
  ai-chat-app/gpt-5-5
)

MODE="${1:-off}"

# a shell-exported var beats .env in expo's env loading - warn so a stale export
# doesn't silently override what this script writes
if [[ "${EXPO_PUBLIC_DEMO_MODE:-}" != "" ]]; then
  echo "warning: EXPO_PUBLIC_DEMO_MODE=${EXPO_PUBLIC_DEMO_MODE} is exported in this shell"
  echo "         it overrides .env - run 'unset EXPO_PUBLIC_DEMO_MODE' before starting the dev server"
  echo ""
fi

set_flag() {
  local env_file="$1" value="$2"
  if grep -q "^EXPO_PUBLIC_DEMO_MODE=" "$env_file" 2>/dev/null; then
    # portable in-place edit (macos sed needs the '' arg)
    sed -i '' "s/^EXPO_PUBLIC_DEMO_MODE=.*/EXPO_PUBLIC_DEMO_MODE=${value}/" "$env_file"
  else
    # keep the file newline-terminated before appending
    [[ -s "$env_file" && $(tail -c1 "$env_file" | wc -l) -eq 0 ]] && echo "" >> "$env_file"
    echo "EXPO_PUBLIC_DEMO_MODE=${value}" >> "$env_file"
  fi
}

show_status() {
  local dir="$1" env_file="$1/.env"
  local flag key_state
  if [[ ! -f "$env_file" ]]; then
    echo "  $dir: NO .env FILE"
    return
  fi
  flag=$(grep "^EXPO_PUBLIC_DEMO_MODE=" "$env_file" | cut -d= -f2 || true)
  case "$flag" in
    1) flag="demo (canned data)" ;;
    0) flag="real (live AI)" ;;
    "") flag="unset (defaults to real)" ;;
  esac
  if grep -q "^OPENAI_API_KEY=..*" "$env_file"; then key_state="key present"; else key_state="KEY MISSING"; fi
  echo "  $dir: $flag | $key_state"
}

case "$MODE" in
  off)
    for app in "${APPS[@]}"; do set_flag "$app/.env" 0; done
    echo "demo mode OFF everywhere - apps will make real AI calls."
    echo "reminder: restart each dev server with a cleared cache (bun start -- -c)."
    ;;
  on)
    for app in "${APPS[@]}"; do set_flag "$app/.env" 1; done
    echo "demo mode ON everywhere - canned data, no AI calls."
    echo "reminder: restart each dev server with a cleared cache (bun start -- -c)."
    ;;
  status)
    ;;
  *)
    echo "usage: $0 [off|on|status]" >&2
    exit 1
    ;;
esac

echo ""
echo "current state:"
for app in "${APPS[@]}"; do show_status "$app"; done
