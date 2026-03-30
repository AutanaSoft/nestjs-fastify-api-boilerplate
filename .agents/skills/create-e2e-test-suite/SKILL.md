---
name: create-e2e-test-suite
description: Create real end-to-end tests for NestJS + Fastify modules using the shared app instance and real infrastructure wiring (no service mocks by default). Use when users ask to add or update E2E coverage for endpoints, contracts, validation errors, and integration flows. Reuse valid base contracts from test constants and build invalid cases by mutating payloads inside each test.
---

# Create E2E Test Suite

Implement E2E tests that execute real HTTP flows and real module integration.

## Mandatory Rules

- Apply `$nestjs-best-practices` for test design decisions.
- Use `getAppInstance` from `test/utils/test-client` in `beforeAll`.
- Do not mock domain/application services in E2E tests unless the user explicitly requests mocks.
- Use shared constants for valid contract payloads in `test/utils/test-constants.ts` as canonical base contracts (for example `createUserPayloadBase`).
- Build invalid scenarios by mutating payloads inside the test, not by creating separate invalid constants.
- Use module orchestration pattern for larger suites:
  - `test/modules/<module>/<module>.e2e-spec.ts` as orchestrator.
  - Sub-suites as `test/modules/<module>/<module>-<scope>.spec.ts` to avoid direct e2e project execution.
- Track created entities in shared suite context and clean DB in orchestrator `afterAll`.
- Keep response contract assertions explicit and ensure sensitive fields (for example `password`) are not exposed.

## Context Collection

Before writing a test, identify:

- HTTP method and route.
- Expected success status and response contract.
- Validation and business error cases.
- Required seed/setup preconditions.

Infer missing details from existing module contracts and schemas.

## Real E2E Workflow

### 1) Locate patterns

Read existing references first:

- `test/utils/test-client.ts`
- `test/utils/test-constants.ts`
- `test/modules/users/users.e2e-spec.ts`
- `test/modules/users/users.e2e.types.ts`
- `test/modules/settings/settings-email.e2e-spec.ts`

### 2) Create test file

Use one of these patterns:

- Single file flow: `test/modules/<module>/<feature>.e2e-spec.ts`.
- Multi-suite flow:
  - Orchestrator: `test/modules/<module>/<module>.e2e-spec.ts`.
  - Sub-suites: `test/modules/<module>/<module>-<scope>.spec.ts`.

Use:

- `NestFastifyApplication`
- `supertest`
- `getAppInstance`
- constants imports for valid payloads
- shared suite context when orchestrating multiple files

### 3) Write success case using canonical contract constants

Use constants as base payloads and keep them valid by default.

```typescript
const uniqueSuffix = Math.random().toString(36).slice(2, 8);

const validPayload = {
  ...createUserPayloadBase,
  email: `${uniqueSuffix}-${createUserPayloadBase.email}`,
  userName: `${createUserPayloadBase.userName}-${uniqueSuffix}`,
};
```

### 4) Write validation/error cases by payload mutation

Mutate in test scope:

```typescript
const invalidPayload = {
  ...validPayload,
  email: 'invalid-email',
};
```

Do not add `invalid*` constants unless the user explicitly asks to share them.

### 5) Assert full contract intent

Assert status code and relevant response structure/fields.
Use focused structural assertions for stability (`objectContaining`, required keys, required value constraints).

## Test Design Guardrails

- Avoid over-coupling tests to volatile infrastructure details.
- Avoid brittle full-body equality unless the endpoint contract is fully stable and deterministic.
- Keep state flow explicit when tests depend on created entities.
- Prefer deterministic setup and cleanup strategy already used by the suite.

## Verification

Run project-defined commands for:

- The new E2E file only.
- The complete E2E suite when needed.

Do not hardcode `npm` commands in this skill. Use project command style and infer package manager from repository setup.

## Output Contract

When using this skill, report:

1. Files created or updated.
2. Which flows are real integration (no mocks).
3. Which valid constants were reused.
4. Which invalid scenarios were built via in-test mutation.
