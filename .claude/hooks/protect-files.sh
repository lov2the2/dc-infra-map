#!/bin/bash
# PreToolUse hook: Block edits to protected files
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
    exit 0
fi

PROTECTED_PATTERNS=(
    ".claude/settings.local.json"
    ".mcp.json"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
    if [[ "$FILE_PATH" == *"$pattern"* ]]; then
        echo "BLOCKED: Cannot edit protected file matching '$pattern'" >&2
        exit 2  # exit 2 = block the tool call
    fi
done

exit 0
