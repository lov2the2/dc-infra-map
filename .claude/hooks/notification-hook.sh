#!/bin/bash
# Notification hook with dev-workflow gate
# Suppresses OS notifications while dev-workflow team mode is running
# to prevent premature intermediate notifications (teammate idle, phase transitions).

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

# Send OS notification
osascript -e "display notification \"$CLAUDE_NOTIFICATION\" with title \"Claude Code\""
