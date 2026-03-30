---
name: create-email-template
description: Create a new email template feature in the NestJS email module, including Zod schema, DTO, React Email template, domain service, module provider/export wiring, and focused tests. Use when users ask to add or implement a new email notification/template flow. Never create or modify HTTP controllers in this skill.
---

# Create Email Template

Implement a new email use case following the project layered pattern and current `src/modules/email/**` conventions.

## Mandatory Rules

- Apply `$nestjs-best-practices` for implementation decisions.
- Keep architecture as `Controller -> Service -> Adapter/Provider`, but do not create or modify controllers in this skill.
- Validate external input with Zod schemas in `src/modules/email/schemas/email-dto.schemas.ts`.
- Keep business orchestration in a service under `src/modules/email/services/<module>/`.
- Use constructor injection and `nestjs-pino` logger.
- Type `catch` errors as `unknown` and narrow with `instanceof Error` before reading properties.
- Use `import type` for type-only imports when appropriate.
- Keep names in English and file names in `kebab-case`.

## Gather Context First

Collect or infer:

- `emailName`: action name (for example `welcome`, `verify-email`, `invoice-ready`).
- `targetModule`: email submodule folder (default `auth`).
- `templateVariables`: required template props beyond base payload.
- `subject`: email subject line.
- `triggerSource`: how this service is called (event/listener/other service).

If details are missing, infer from existing patterns and keep changes minimal.

## Analyze Existing Patterns

Review these files before editing:

- `src/modules/email/templates/auth/WelcomeEmailTemplate.tsx`
- `src/modules/email/services/auth/welcome-email.service.ts`
- `src/modules/email/schemas/email-dto.schemas.ts`
- `src/modules/email/email.module.ts`
- `src/modules/email/constants/email.constants.ts`

Reuse local conventions for naming, imports, logging, and error handling.

## Implementation Workflow

### 1) Update or add schema

Add a new input schema in `src/modules/email/schemas/email-dto.schemas.ts` by extending the closest base schema.

```typescript
export const MyNewEmailInputSchema = EmailInputSchema.extend({
  actionUrl: z.url().describe('Action URL'),
});

export type MyNewEmailInput = z.infer<typeof MyNewEmailInputSchema>;
```

Also export schema/type through `src/modules/email/schemas/index.ts` if required by module conventions.

### 2) Create DTO (when the flow uses DTOs)

Create DTO in `src/modules/email/dto/<module>/` with `createZodDto`.

```typescript
export class MyNewEmailDto extends createZodDto(MyNewEmailInputSchema) {}
```

If no DTO is used by the current call path, skip DTO creation.

### 3) Create React Email template

Create template at `src/modules/email/templates/<module>/<PascalName>Template.tsx`.

- Use `BaseLayoutComponent`.
- Add `Preview` text.
- Keep props aligned with validated payload fields used in rendering.
- Add `PreviewProps` for local template preview.

### 4) Create service

Create service in `src/modules/email/services/<module>/<email-name>-email.service.ts`.

Service responsibilities:

- Parse payload with the new schema.
- Build template element with `React.createElement`.
- Render HTML using `EmailTemplateProvider`.
- Send email through `EMAIL_SENDER`.
- Log success and error with `PinoLogger`.
- Throw `InternalServerErrorException` on processing failure.

Do not include transport-specific logic in the service.

### 5) Register service in module

Update `src/modules/email/email.module.ts`:

- Add service to `providers`.
- Add service to `exports` when needed by other modules.

Do not add controller routes or controller bindings.

### 6) Optional integration wiring

If this use case is triggered by events, wire it from the corresponding listener/service without introducing new HTTP endpoints.

## Tests

### Unit test (required)

Create `src/modules/email/services/<module>/<email-name>-email.service.spec.ts`.

Validate at least:

- Success flow: validate -> render -> send.
- Error flow: sender or renderer failure logs and throws.
- Payload parsing uses the new Zod schema.

### E2E test (optional)

Add only if the project already has a non-controller email integration path to test end-to-end.

## Validation Checklist

Run the project commands for:

- Type checking/build validation.
- Focused unit test for the new service.
- Any affected test suites.

Use the package-manager commands configured by the project, without hardcoding one tool in this skill.

## Output Contract

When executing this skill, return:

1. Files created/updated.
2. Short explanation of architectural decisions.
3. Validation commands executed and results.
4. Explicit confirmation that no controller was created or modified.
