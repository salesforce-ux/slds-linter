# Release Process

This document outlines the steps to create a new release of the project.

## Prerequisites

Before starting the release process, ensure you have:

1. GitHub CLI (`gh`) installed and authenticated:
   ```bash
   # Check if gh is installed
   gh --version

   # Check authentication status
   gh auth status
   ```

   If not installed, follow the [GitHub CLI installation guide](https://cli.github.com/manual/installation).

2. Proper GitHub authentication:
   - You must be logged in to GitHub CLI
   - Your account must have appropriate permissions for the repository
   - Run `gh auth login` if you need to authenticate

## Preparation Steps

1. Clean the repository and ensure a fresh state:
   ```bash
   git clean -xfd
   ```

2. Install dependencies and build the project:
   ```bash
   yarn
   yarn build
   ```

## Release Process

### Using the Release Script

The project includes an automated release script that can be run using:
```bash
yarn release
```

#### Available Options

- `--dry-run`: Skips publishing to npm and git operations
- `--skip-check`: Skips checking working directory git status
- `--skip-npm-publish`: Runs `npm publish --dry-run` instead of publishing

#### Release Versions

The script doesn't prompt for versions. Before running it, set the version and npm tag for each package in `release-versions.json` at the repository root:

```json
{
  "packages": {
    "@salesforce-ux/eslint-plugin-slds": { "version": "2.0.0", "tag": "latest" },
    "@salesforce-ux/eslint-plugin-react-slds": { "version": "1.0.0-beta.1", "tag": "beta" },
    "@salesforce-ux/slds-linter": { "version": "2.0.0", "tag": "latest" }
  }
}
```

- Every workspace package needs an entry with a valid semver `version` and an npm `tag`.
- Each package is published with its own version and tag. Workspace dependencies are pinned to the versions in this file.
- The `@salesforce-ux/slds-linter` version names the release branch (`release/<version>`), the git tag, and the GitHub release.
- A GitHub release is created only when the `@salesforce-ux/slds-linter` version isn't a pre-release (e.g., `2.0.0`, not `2.0.0-beta.0`).

> **Important**: 
> - Final releases must always be created from the `main` branch
> - Pre-release versions (Alpha/Beta) can be created from `dev` or feature branches
> - Ensure you're on the correct branch before starting the release process

### Automated Steps
During the release process, the following automated tasks will be performed:
- Commenting on relevant PRs
- Applying release labels
- Generating release notes

### Manual Steps (if automated tasks fail)

If any of the automated tasks fail, developers should follow these manual steps:

1. If PR commenting or label application fails:
   ```bash
   node ./scripts/comment-release-prs.js
   ```

2. If release notes generation fails:
   - Go to the GitHub release tab
   - Manually update the release notes with the appropriate content

#### Manually Generating Release Notes

You can manually generate release notes using the release notes generator script. Create a temporary file (e.g., `list-changes.js`) with the following content:

```javascript
import { generateReleaseNotes } from "./scripts/generate-release-notes.js";

// Replace these versions with your current and previous versions
generateReleaseNotes("0.1.9", "0.1.8");
```

Then run it using:
```bash
node list-changes.js
```

> **Important Note**: Neither the PR commenting script nor the release notes generation will block the release process if they fail. Developers must ensure these tasks are completed manually if the automated process fails.

## Verification

After the release is complete, verify that:
1. All PRs have been properly commented on
2. Release labels have been applied correctly
3. Release notes are complete and accurate
