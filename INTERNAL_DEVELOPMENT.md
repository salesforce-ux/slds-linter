# Internal Development Guide

This guide covers how to set up and work with the internal repository (`slds-linter-internal`) alongside the public repository (`slds-linter`).

---

## 1. Clone the Public Repository

```bash
git clone https://github.com/salesforce-ux/slds-linter.git
cd slds-linter
```

## 2. Set Up the Internal Remote

Add the internal repository as a second remote named `internal`:

```bash
git remote add internal git@github.com:salesforce-ux-emu/slds-linter-internal.git
git fetch internal
```

Create a local `internal/main` branch that tracks the remote:

```bash
git checkout -b internal/main internal/main
```

> **Note:** Do not use `git checkout internal/main` directly — that results in a detached HEAD state since `internal/main` is a remote-tracking reference. Always use `-b` to create a local branch.

Verify both remotes are configured:

```bash
git remote -v
```

Expected output:

```
internal  git@github.com:salesforce-ux-emu/slds-linter-internal.git (fetch)
internal  git@github.com:salesforce-ux-emu/slds-linter-internal.git (push)
origin    git@github.com:salesforce-ux/slds-linter.git (fetch)
origin    git@github.com:salesforce-ux/slds-linter.git (push)
```

## 3. Working on Internal Changes

### Branch Strategy

All internal work should be done on feature branches created from `internal/main`.

**Create a feature branch:**

```bash
git fetch internal
git checkout -b internal/feature/<feature-name> internal/main
```

**Push the branch to the internal remote:**

```bash
git push internal internal/feature/<feature-name>
```

### Naming Convention

| Branch | Purpose |
| --- | --- |
| `internal/main` | Stable internal branch (mirrors public `main` + internal-only changes) |
| `internal/feature/<name>` | Feature branches for internal work |
| `internal/bugfix/<name>` | Bug fix branches for internal issues |

### Keeping Internal Main Up to Date with Public

Periodically sync `internal/main` with the latest public changes:

```bash
git fetch origin
git checkout internal/main
git merge origin/main
git push internal internal/main
```

## 4. Publishing Changes to Public

When internal changes are ready to be made public, use **cherry-pick** or **merge** depending on the situation.

### Option A: Cherry-Pick Specific Commits

Use this when only select commits from an internal branch should go public.

```bash
# Switch to a new branch off origin/main
git fetch origin
git checkout -b public/<feature-name> origin/main

# Cherry-pick the desired commits
git cherry-pick <commit-hash>

# Push to origin and open a PR
git push origin public/<feature-name>
```

### Option B: Merge an Entire Branch

Use this when all changes on an internal branch are ready for public release.

```bash
# Switch to a new branch off origin/main
git fetch origin
git checkout -b public/<feature-name> origin/main

# Merge the internal branch
git merge internal/feature/<feature-name>

# Push to origin and open a PR
git push origin public/<feature-name>
```

### Important Notes

- **Always open a Pull Request** against `origin/main` for review before merging to public.
- **Do not push directly** to `origin/main`.
- **Sensitive or internal-only code** should never be cherry-picked or merged to public. Review changes carefully before publishing.

---

## Quick Reference

```bash
# Add internal remote (one-time setup)
git remote add internal git@github.com:salesforce-ux-emu/slds-linter-internal.git

# Create an internal feature branch
git checkout -b internal/feature/my-feature internal/main

# Push internal branch
git push internal internal/feature/my-feature

# Cherry-pick to public
git checkout -b public/my-feature origin/main
git cherry-pick <commit-hash>
git push origin public/my-feature
```
