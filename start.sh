#!/bin/bash
# ─────────────────────────────────────────────
# start.sh — Timer App Yoga
# Opens all 4 services in separate Terminal tabs.
# Usage: just double-click, or run:  bash start.sh
# ─────────────────────────────────────────────

# Detect where this script lives (works wherever project is)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

open_tab() {
  local title="$1"
  local cmd="$2"
  osascript <<EOF
tell application "Terminal"
  activate
  tell application "System Events" to keystroke "t" using command down
  delay 0.4
  do script "echo '── $title ──' && $cmd" in front window
end tell
EOF
}

echo "🧘 Starting Timer App Yoga..."

# 1. Node server first (others depend on it)
open_tab "NODE SERVER :3001" "cd '$DIR/server' && npm run dev"
sleep 1

# 2. Python API
open_tab "PYTHON API :8001" "cd '$DIR/python-api' && source .venv/bin/activate && uvicorn main:app --reload --port 8001"
sleep 1

# 3. Admin panel
open_tab "ADMIN PANEL :3000" "cd '$DIR/admin' && npm start"
sleep 1

# 4. Expo (mobile)
open_tab "EXPO (mobile)" "cd '$DIR' && npx expo start --web"

echo "✓ All 4 tabs opened."
echo "  Node server  → :3001"
echo "  Python API   → :8001"
echo "  Admin panel  → :3000"
echo "  Expo         → scan QR"