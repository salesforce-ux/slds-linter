#!/bin/bash

# Check if README.md is among the staged files
if git diff --cached --name-only | grep -q "^README.md$"; then
    echo "README.md has been modified. Copying to ./packages/cli/README.md"

    # Copy README.md to ./packages/cli/README.md
    cp README.md ./packages/cli/README.md

    # Stage the copied file
    git add ./packages/cli/README.md

    echo "Copied and staged ./packages/cli/README.md"
else
    echo "README.md has not been modified. No action taken."
fi