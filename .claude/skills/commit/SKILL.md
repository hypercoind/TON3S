---
name: commit
description: Automates git commit workflow with standardized commit messages for the TON3S static site project.
---

# Commit Skill

**Automates the git commit workflow with standardized commit messages**

This skill handles the complete commit workflow including:
- Gathering staged/unstaged changes and recent commit history
- Auto-staging changes when nothing is staged
- Generating commit messages following project conventions
- Post-commit status and push reminders

## Usage

```bash
/commit                    # Auto-stage all changes and commit
/commit "message"          # Use provided commit message
```

---

# Skill Implementation

You are helping the user commit their changes to git. Follow these phases carefully.

## Phase 1: Gather Information

Run these commands in parallel to understand the current state:

### 1.1 Check Git Status
```bash
git status
```
Note: Never use `-uall` flag as it can cause memory issues on large repos.

### 1.2 Check Staged Changes
```bash
git diff --cached
```
If nothing staged, also run:
```bash
git diff
```

### 1.3 Check Recent Commit Style
```bash
git log --oneline -5
```

## Phase 2: Stage Changes

**If nothing is currently staged:**
- Inform the user that nothing is staged
- Automatically run `git add .` to stage all changes
- Show updated status after staging

**If changes are already staged:**
- Proceed with what's staged
- Mention any unstaged changes that won't be included

## Phase 3: Generate Commit Message

Follow the project conventions from CLAUDE.md:

### Message Format
```
<summary line: lowercase, present tense, <50 chars>

<optional body: context for non-trivial changes>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Style Rules
- Use lowercase, present tense (e.g., "add feature" not "Added feature")
- Summary describes the "what" and "why" concisely
- Body provides context for non-trivial changes
- Reference issue numbers when applicable (e.g., "fixes #6")
- No period at end of summary line

### Summary Examples
Good:
- `add dark mode toggle to settings`
- `fix cache invalidation on logout`
- `update editor auto-scroll logic`
- `refactor theme switching for performance`

Bad:
- `Added dark mode toggle` (capitalized, past tense)
- `Fix bug.` (vague, has period)
- `Update code` (not descriptive)

### Analysis Steps
1. Review all staged changes (files and their diffs)
2. Categorize: new feature, enhancement, bug fix, refactor, test, docs, etc.
3. Identify the primary purpose of the changes
4. Draft a summary that captures the essence
5. Add body only if the changes need explanation

## Phase 4: Execute Commit

### 4.1 Run the Commit

ALWAYS use HEREDOC format for the commit message:

```bash
git commit -m "$(cat <<'EOF'
<summary line>

<optional body>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 4.2 Handle Errors

If the commit fails:
1. Read the error message carefully
2. Display the error to the user
3. Suggest how to resolve it
4. Do NOT retry automatically for unknown errors

### 4.3 Safety Guardrails

**NEVER do these:**
- Use `--no-verify` to skip hooks
- Use `--amend` unless explicitly requested by user
- Push to remote automatically
- Commit files that look like secrets (.env, credentials.json, etc.)
- Use interactive git commands (-i flag)

## Phase 5: Post-Commit

### 5.1 Verify Success

Run:
```bash
git status
```

Confirm working tree is clean (or shows expected unstaged files).

### 5.2 Show Commit

Run:
```bash
git log -1 --format=fuller
```

### 5.3 Push Reminder

Display:
```
Commit successful!

To push your changes:
  git push

Note: Per project convention, commits are not auto-pushed.
Would you like me to push these changes?
```

Wait for user confirmation before pushing.

---

## Output Formats

### Success Output

```
Commit successful!

Commit: <short hash>
Message: <summary line>

Files changed:
  - <file1>
  - <file2>
  ...

To push: git push
```

### Failure Output

```
Commit failed

Error:
<error details>

Please fix the issues and try again with /commit
```

---

## Special Cases

### Empty Staging Area with No Changes

If `git status` shows clean working tree:
```
Nothing to commit - working tree is clean

No staged or unstaged changes found.
```

### Only Untracked Files

If there are only untracked files:
1. Show the untracked files
2. Ask user which files to add (or all)
3. Stage selected files
4. Proceed with commit

### User Provides Custom Message

If the user invokes `/commit "custom message"`:
1. Use their message as the summary line
2. Still append the Co-Authored-By footer
3. Skip automatic message generation

### Merge Commits

If in the middle of a merge:
```
Detected merge in progress

Current merge: main <- feature/xyz

To complete the merge:
  git commit  (will use default merge message)

To abort the merge:
  git merge --abort
```

---

## Files to Reference

- `/Users/hypercoin/src/TON3S/CLAUDE.md` (project documentation)
