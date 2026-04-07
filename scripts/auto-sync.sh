#!/bin/bash
# Auto-sync script - chạy sau khi agent hoàn thành task
set -euo pipefail

WORKSPACE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$WORKSPACE_DIR"

# Only commit if there are changes
if git diff --quiet HEAD 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
    echo "No changes to commit"
    exit 0
fi

# Add all changes
git add .

# Commit with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
git commit -m "Auto-sync: $TIMESTAMP" -m "Updated by TPK Dev Studio agent"

# Push
git push origin master

echo "✅ Synced to GitHub at $TIMESTAMP"
