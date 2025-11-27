#!/usr/bin/env bash
# Pre-commit hook script to check lint errors/warnings and compare with last commit

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STATS_FILE="$PROJECT_ROOT/.git/lint-stats.json"

# Function to extract errors and warnings from lint output
extract_counts() {
  local output="$1"
  # Extract from the summary line that contains "SLDS Violations" to avoid matching fixable counts
  # The summary line format is: "✖ 587 SLDS Violations (105 errors, 482 warnings)"
  local summary_line=$(echo "$output" | grep -E "SLDS Violations.*\([0-9]+ errors.*[0-9]+ warnings\)" | head -1)
  if [ -n "$summary_line" ]; then
    local errors=$(echo "$summary_line" | grep -oE '[0-9]+ errors' | head -1 | grep -oE '[0-9]+' || echo "0")
    local warnings=$(echo "$summary_line" | grep -oE '[0-9]+ warnings' | head -1 | grep -oE '[0-9]+' || echo "0")
    echo "$errors $warnings"
  else
    # Fallback to original method if summary line format changes
    # Use head -1 to only get the first match (from summary, not fixable line)
    local errors=$(echo "$output" | grep -oE '[0-9]+ errors' | head -1 | grep -oE '[0-9]+' || echo "0")
    local warnings=$(echo "$output" | grep -oE '[0-9]+ warnings' | head -1 | grep -oE '[0-9]+' || echo "0")
    echo "$errors $warnings"
  fi
}

# Function to read last commit stats
read_last_stats() {
  if [ -f "$STATS_FILE" ]; then
    cat "$STATS_FILE"
  else
    echo "{}"
  fi
}

# Function to write stats
write_stats() {
  local errors=$1
  local warnings=$2
  echo "{\"errors\": $errors, \"warnings\": $warnings, \"commit\": \"$(git rev-parse HEAD 2>/dev/null || echo 'none')\"}" > "$STATS_FILE"
}

# Function to prompt user
prompt_user() {
  local current_errors=$1
  local current_warnings=$2
  local last_errors=$3
  local last_warnings=$4
  
  echo ""
  echo "⚠️  Lint count mismatch detected!"
  echo "   Last commit: $last_errors errors, $last_warnings warnings"
  echo "   Current:     $current_errors errors, $current_warnings warnings"
  echo ""
  
  # Check if running in CI environment (non-interactive)
  if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ] || [ -n "$GITLAB_CI" ] || [ -n "$JENKINS_URL" ]; then
    echo "⚠️  Running in CI environment. Skipping prompt and allowing commit."
    return 0
  fi
  
  # In git hooks, use /dev/tty for user input (works even when stdin is not a TTY)
  if [ -c /dev/tty ]; then
    echo -n "Continue with commit? (y/N): " > /dev/tty
    read -r REPLY < /dev/tty
    echo "" > /dev/tty
    if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
      echo "Commit aborted."
      exit 1
    fi
  else
    # Fallback: try stdin if /dev/tty is not available
    echo -n "Continue with commit? (y/N): "
    read -r REPLY
    echo ""
    if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
      echo "Commit aborted."
      exit 1
    fi
  fi
}

cd "$PROJECT_ROOT"

# Check for bypass flag in commit message
# Note: In pre-commit hook, we check the last commit message (for amended commits)
# or the commit message file if it exists (for commits with -m flag)
if git log -1 --pretty=%B 2>/dev/null | grep -q '\[skip-lint-check\]'; then
  echo "⏭️  Skipping lint check (commit message flag detected)"
  exit 0
fi

# Also check commit message file if it exists (for commits being created with -m flag)
COMMIT_MSG_FILE="$PROJECT_ROOT/.git/COMMIT_EDITMSG"
if [ -f "$COMMIT_MSG_FILE" ]; then
  if grep -q '\[skip-lint-check\]' "$COMMIT_MSG_FILE" 2>/dev/null; then
    echo "⏭️  Skipping lint check (commit message flag detected)"
    exit 0
  fi
fi

echo "📦 Installing dependencies..."
if ! yarn > /tmp/yarn-output.log 2>&1; then
  echo "❌ Dependency installation failed!"
  cat /tmp/yarn-output.log
  exit 1
fi

echo "🔨 Running build..."
if ! yarn build > /tmp/build-output.log 2>&1; then
  echo "❌ Build failed!"
  cat /tmp/build-output.log
  exit 1
fi

echo "🔍 Running linter on demo/small-set..."
# Run lint and capture output, suppress detailed logs
# Use the local build directly to ensure we're testing the freshly built code
LINT_OUTPUT=$(node "$PROJECT_ROOT/packages/cli/build/index.js" lint demo/small-set 2>&1 || true)
LINT_EXIT_CODE=$?

# Extract counts from output
read -r CURRENT_ERRORS CURRENT_WARNINGS <<< "$(extract_counts "$LINT_OUTPUT")"

# Only display the summary line (errors and warnings count)
# Match the same pattern we use for extraction to ensure consistency
SUMMARY_LINE=$(echo "$LINT_OUTPUT" | grep -E "SLDS Violations.*\([0-9]+ errors.*[0-9]+ warnings\)" | head -1 || echo "")
if [ -n "$SUMMARY_LINE" ]; then
  echo "$SUMMARY_LINE"
fi

# Validate that we extracted counts successfully
if [ -z "$CURRENT_ERRORS" ] || [ -z "$CURRENT_WARNINGS" ]; then
  echo "❌ Failed to extract error/warning counts from lint output!"
  echo "Full output:"
  echo "$LINT_OUTPUT"
  exit 1
fi

# Read last commit stats
LAST_STATS=$(read_last_stats)
LAST_ERRORS=$(echo "$LAST_STATS" | grep -oE '"errors":\s*[0-9]+' | grep -oE '[0-9]+' || echo "")
LAST_WARNINGS=$(echo "$LAST_STATS" | grep -oE '"warnings":\s*[0-9]+' | grep -oE '[0-9]+' || echo "")

# Validate extracted stats
if [ -n "$LAST_ERRORS" ] && [ -n "$LAST_WARNINGS" ]; then
  # Verify they are numeric
  if ! [[ "$LAST_ERRORS" =~ ^[0-9]+$ ]] || ! [[ "$LAST_WARNINGS" =~ ^[0-9]+$ ]]; then
    echo "⚠️  Invalid stats file format. Resetting stats."
    LAST_ERRORS=""
    LAST_WARNINGS=""
  fi
fi

# If we have last commit stats, compare
if [ -n "$LAST_ERRORS" ] && [ -n "$LAST_WARNINGS" ]; then
  if [ "$CURRENT_ERRORS" != "$LAST_ERRORS" ] || [ "$CURRENT_WARNINGS" != "$LAST_WARNINGS" ]; then
    prompt_user "$CURRENT_ERRORS" "$CURRENT_WARNINGS" "$LAST_ERRORS" "$LAST_WARNINGS"
  else
    echo "✅ Lint counts match last commit ($CURRENT_ERRORS errors, $CURRENT_WARNINGS warnings)"
  fi
else
  echo "ℹ️  No previous lint stats found. Saving current counts..."
fi

# Save current stats for next commit
write_stats "$CURRENT_ERRORS" "$CURRENT_WARNINGS"

echo "✅ Pre-commit checks passed!"

