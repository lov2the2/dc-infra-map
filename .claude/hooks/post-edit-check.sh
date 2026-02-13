#!/bin/bash
# Post-edit build check hook
# Runs tsc --noEmit after TypeScript file edits
# to catch compilation errors immediately.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
    exit 0
fi

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

# TypeScript files
if [[ "$FILE_PATH" == *.ts || "$FILE_PATH" == *.tsx ]]; then
    cd "$PROJECT_DIR" || exit 0
    OUTPUT=$(npx tsc --noEmit 2>&1)
    if [ $? -ne 0 ]; then
        echo "TypeScript errors detected:"
        echo "$OUTPUT" | head -20
        exit 0
    fi
fi

exit 0
