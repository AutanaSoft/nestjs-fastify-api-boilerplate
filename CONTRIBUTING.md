# Contributing Guide

Thanks for contributing.

## Development Setup

1. Fork and clone the repository.
2. Install dependencies:

```bash
pnpm install
```

3. Configure environment:

```bash
cp .env.example .env
```

4. Start development server:

```bash
pnpm start:dev
```

## Branch Strategy

- Create feature branches from `main`
- Keep pull requests focused and small
- Use descriptive branch names

## Code Standards

- Language: TypeScript
- Framework: NestJS + Fastify
- Package manager: `pnpm`
- Input validation: Zod + `nestjs-zod`
- Architecture: `Controller -> Service -> Repository`

## Quality Checks

Before opening a PR, run:

```bash
pnpm lint
pnpm test:unit
pnpm build
```

Run E2E tests when behavior changes affect API contracts:

```bash
pnpm test:e2e
```

## Commit Messages

Follow Conventional Commits:

- `feat: ...`
- `fix: ...`
- `refactor: ...`
- `test: ...`
- `docs: ...`
- `chore: ...`

## Pull Requests

- Use the PR template
- Describe intent and impact clearly
- Link related issues when applicable
- Include evidence (logs, tests, screenshots) when relevant

## Reporting Issues

Use issue templates for:

- Bug reports
- Feature requests
- Questions

For security issues, follow `SECURITY.md`.
