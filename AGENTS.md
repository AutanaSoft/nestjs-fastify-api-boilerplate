# AGENTS

## 1. Scope and principles

- Build as a senior TypeScript + NestJS engineer.
- Prioritize minimal, production-safe changes within current API boundaries.
- Keep changes focused; avoid unrelated refactors.
- Do not introduce Hexagonal/Clean architecture unless explicitly requested.

## 2. Mandatory skills

- Use `nestjs-best-practices` for implementation/review/refactor decisions.
- Use `commit-message-generator` for any commit message or commit creation task.
- Use `create-e2e-test-suite` when creating, modifying, or reviewing E2E tests.
- Use `create-email-template` when creating, modifying, or reviewing the email module.

## 3. Language policy

- Developer communication: Spanish.
- Code artifacts, technical docs, and JSDoc: English.
- Keep identifiers, file/folder names, and config keys in English.

## 4. Technology boundaries

- Framework: NestJS + TypeScript.
- HTTP server: Fastify.
- Authentication: `@nestjs/passport`, `passport`, `@nestjs/jwt`, `passport-jwt`.
- WebSockets: `@nestjs/websockets`, `@nestjs/platform-socket.io`.
- Database: PostgreSQL with Prisma.
- Validation: Zod + `nestjs-zod`.
- Testing: Jest + Supertest.
- Package manager: `pnpm` only.

## 5. Implementation priorities

### MUST

- Follow layered architecture: `Controller -> Services -> Repository`.
- Organize by feature module.
- Keep database access centralized under `src/modules/database/**`.
- Never edit generated Prisma files under `src/modules/database/prisma/generated/**`.
- Follow a schema-first contract model with Zod.
- Validate all external inputs (`body`, `query`, `params`) with Zod DTOs.
- Serialize API responses with `createZodDto` + `@ZodSerializerDto(...)`.
- Export only Zod schemas from `schemas/**`.
- In `interfaces/**`, define exported `type`/`interface` as aliases inferred from schemas (`z.infer`, `z.input`, `z.output`).
- Avoid manually defining exported contract types that duplicate a Zod schema shape.
- Validate untrusted boundary payloads (for example decoded JWTs, event payloads, queue messages) with their Zod schemas before use.
- Never return raw DB entities directly to clients.
- Use constructor injection (no service locator pattern).
- Throw HTTP exceptions from services when needed.
- Use `nestjs-pino` for runtime logs; do not use `console.log`.
- Keep catch blocks typed as `unknown`; narrow with `instanceof Error` before reading error properties.
- Document generated code with TSDoc (JSDoc-compatible) in English for public classes, methods, and exported functions.
- Add concise code comments in English for sensitive, non-obvious, or complex logic.
- Never commit secrets.

### SHOULD

- Prefer focused services per responsibility over god services.
- Use repository abstraction + one concrete persistence implementation.
- Use event-driven decoupling where useful.
- Prefer `import type` for type-only imports.
- Prefer explicit types when inference is unclear.
- Use guard clauses over deep nesting.
- Run minimum relevant checks (`lint`/tests) for touched areas.

### MAY

- Add `ZodSerializerInterceptor` globally for response consistency.

## 6. Naming conventions

- `PascalCase`: classes, interfaces, types, enums, decorators.
- `camelCase`: vars, functions, methods, properties.
- `kebab-case`: files/directories.
- `SCREAMING_SNAKE_CASE`: constants and env vars.
- Prefix private members with `_`.
- Prefer full words over abbreviations.

## 7. NestJS naming conventions

- Controllers: `SubjectController` (for example `UsersController`).
- Services: either `SubjectService` or split by responsibility
  (for example `UsersCreateService`, `UsersUpdateService`, `UsersDeleteService`).
- Repositories: `SubjectRepository` (for example `UsersRepository`).
- Entities/Models: `Subject` (for example `User`).
- DTOs: `ActionSubjectDto` (for example `CreateUserDto`).

## 8. Canonical module pattern

- Use `src/modules/users/**` as the canonical pattern for new modules and refactors.
- Replicate:
  - Layering: `Controller -> Services -> Repository`.
  - Service split by use case type (`create/update/delete` when applicable).
  - One module DTO barrel: `<module>.dto.ts`.
  - Zod input/output schemas + serializer DTOs.
  - Abstract repository contract + one persistence implementation bound in module providers.
  - Module-local persistence error helper under `errors/`.
- Do not introduce a different module structure unless explicitly requested.

## 9. Commands

- Use `pnpm` for all commands.
- Common checks:
  - `pnpm lint`
  - `pnpm format`
  - `pnpm test`
  - `pnpm test:unit`
  - `pnpm test:e2e`
  - `pnpm build`

## 10. Operational constraints

- Avoid destructive git actions unless explicitly requested.
- Preserve existing project conventions.
- Keep outputs concise and actionable.

## 11. E2E conventions

- Prefer real integration E2E tests (no service mocks) unless explicitly requested.
- Reuse valid base contract constants from `test/utils/test-constants.ts`.
- Build invalid cases by mutating payloads inside the test.
- For multi-suite modules, use:
  - `test/modules/<module>/<module>.e2e-spec.ts` as orchestrator.
  - `test/modules/<module>/<module>-<scope>.spec.ts` for sub-suites.
- Keep created entity IDs in shared context and cleanup database records in orchestrator `afterAll`.
