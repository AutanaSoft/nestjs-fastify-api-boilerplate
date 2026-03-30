---
name: commit-message-generator
description: Generates commit messages using Conventional Commits and project commitlint rules. Use this skill when the user asks to create, generate, make, or write a commit message, or asks to commit and optionally push changes.
---

# Commit Message Generator

This skill generates accurate Git commit messages from real diffs and can optionally run `git commit`
and `git push` when the user explicitly requests those actions.

## When to Use

Use this skill when the user asks to:

- Create, generate, make, or write a commit message
- Draft a Conventional Commit message
- Commit staged changes
- Commit and push changes

Do not use this skill when "create" is unrelated to Git or commits.

## Operating Modes

1. Message only (default)
2. Message + local commit (only if explicitly requested)
3. Message + local commit + push (only if explicitly requested)

## Mandatory Rules

- `scope` is mandatory and must describe the affected module, component, or package.
- The header must follow: `type(scope): description`.
- Header length must be 100 characters or less.
- Body and footer lines must be 100 characters or less.
- If necessary, provide a body or footer for breaking changes or detailed context.
- Use a `BREAKING CHANGE:` footer when API behavior, contracts, or response shapes change.
- Analyze actual diffs before drafting the message. Never guess change content.
- Default language is English unless the user asks for another language.

## Available Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Formatting-only changes that do not affect behavior
- `refactor`: Code change that is neither a fix nor a feature
- `perf`: Performance improvements
- `test`: Add or update tests
- `build`: Build system or dependency changes
- `ci`: CI configuration or pipeline changes
- `chore`: Other maintenance changes
- `revert`: Revert a previous commit

## Required Workflow

1. Run `git status` to inspect modified, staged, and untracked files.
2. Run `git diff` to inspect unstaged changes.
3. Run `git diff --staged` when staged files exist.
4. Determine the best `type` and infer a concise `scope`.
5. Draft a clear commit message based on the observed changes.
6. Add body/footer when the change is non-trivial, cross-module, or includes behavioral/API impact.
7. If changes are breaking, include one or more `BREAKING CHANGE:` footer lines.
8. If explicitly requested, run `git commit`.
9. If explicitly requested, run `git push` after a successful commit.

## Scope Inference Heuristics

If scope is not provided, infer it from staged paths:

- `src/modules/auth/**` -> `auth`
- `src/modules/email/**` -> `email`
- `src/modules/users/**` -> `users`
- `test/**` -> `test`
- `docs/**` -> `docs`
- `config/**` -> `config`
- Multiple unrelated areas -> choose the dominant module, or use `core`

## Git Safety Rules

- Never run destructive Git commands.
- Never run `push --force`.
- Never commit or push unless the user explicitly asks.
- Do not create empty commits when there are no changes.
- Warn before committing files that may contain secrets (`.env`, credentials, tokens, private keys).
- If hooks fail, report the failure and stop; do not bypass verification unless explicitly requested.

## Output Contract

### A Message-only mode

Return the proposed commit message text ready to copy, using:

- Header only for trivial changes.
- Header + body for non-trivial changes.
- Header + body + footer for breaking changes.

Do not add extra explanation or metadata outside the commit message content.

### B Commit mode

Before committing, display the proposed commit message and obtain explicit user approval. Return:

- The commit message used (after user approval)
- Commit result summary (hash + subject)
- Final short status

### C Commit + push mode

Before committing and pushing, display the proposed commit message and obtain explicit user approval. Return:

- The commit message used (after user approval)
- Commit result summary
- Target branch/remote
- Push result summary

## Examples

Input: "Generate a commit message for auth refresh token changes"
Output:

```text
feat(auth): implement refresh token rotation in authentication flow

Add token family tracking and invalidate previous refresh tokens on rotation.
Improve session security by detecting token reuse.
```

Input: "Generate a commit message for users API contract updates with breaking changes"
Output:

```text
refactor(users): align user update and verification response contracts

Standardize service output validation with safeParse and improve persistence error mapping reuse.
Move Prisma error translation into shared database utilities for cross-module adoption.

BREAKING CHANGE: PATCH /users/:id now returns the updated user payload.
BREAKING CHANGE: PATCH /users/:id/password and /users/verify/by-email/:email now return 204.
```

Input: "Commit and push staged changes"
Action: Generate message -> Commit -> Push (without force)
