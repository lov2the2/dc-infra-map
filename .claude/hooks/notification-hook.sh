#!/bin/bash
# Notification hook with dev-workflow gate + team dedup
# Suppresses OS notifications while dev-workflow team mode is running
# and deduplicates rapid-fire notifications from team subagents.

LOCK_FILE="/tmp/claude-dev-workflow.lock"

# Clean up stale lock files (older than 2 hours)
if [ -f "$LOCK_FILE" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        LOCK_AGE=$(( $(date +%s) - $(stat -f %m "$LOCK_FILE") ))
    else
        LOCK_AGE=$(( $(date +%s) - $(stat -c %Y "$LOCK_FILE") ))
    fi

    if [ "$LOCK_AGE" -gt 7200 ]; then
        rm -f "$LOCK_FILE"
    fi
fi

# If workflow lock exists, suppress notification
if [ -f "$LOCK_FILE" ]; then
    exit 0
fi

# --- Timestamp-based dedup for team mode ---
# Suppresses rapid-fire notifications within cooldown window.
# First notification sends, subsequent ones within window are skipped.
DEDUP_COOLDOWN=5
DEDUP_FILE="/tmp/claude-hook-notification-dedup-$(echo "$PWD" | md5 -q 2>/dev/null || echo "default")"
CURRENT_TIME=$(date +%s)

if [ -f "$DEDUP_FILE" ]; then
    LAST_TIME=$(cat "$DEDUP_FILE" 2>/dev/null || echo 0)
    DIFF=$((CURRENT_TIME - LAST_TIME))
    if [ "$DIFF" -lt "$DEDUP_COOLDOWN" ]; then
        exit 0
    fi
fi

echo "$CURRENT_TIME" > "$DEDUP_FILE"

# Send OS notification
osascript -e "display notification \"$CLAUDE_NOTIFICATION\" with title \"Claude Code\""
