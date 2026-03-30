---
name: nestjs-config-pattern
description: Standardize NestJS application configuration with Zod-validated env schemas, ConfigModule setup, namespaced registerAs configs, and type-safe consumption. Use this skill whenever creating or modifying files in src/config/, env validation, or ConfigModule wiring in AppModule.
---

# NestJS Config Pattern Skill

Use this skill when the task involves configuration design or changes in NestJS, especially:

- Creating or updating files under `src/config/`
- Adding/changing environment variables
- Defining env validation schemas
- Updating `ConfigModule.forRoot(...)` in `AppModule`
- Reading config in services/modules

## Goals

- Keep configuration centralized and predictable
- Fail fast on invalid/missing critical env variables
- Preserve type safety end-to-end
- Prefer explicit, namespaced config boundaries

## Required Pattern

### 1 File location and naming

- Place config files in `src/config/`
- Use `kebab-case` file names ending with `.config.ts` (for example: `app.config.ts`)

### 2 Namespaced config factory

- Use `registerAs('<namespace>', () => ({ ... }))`
- Parse/coerce values explicitly (`z.coerce.number()`, `Number(...)`, etc.)
- Export inferred types when needed
- Prefer an explicit exported factory function for clarity and reuse

Example:

```typescript
// src/config/app.config.ts
import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const appEnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type AppConfig = z.infer<typeof appEnvSchema>;

// 3. Factory (preferred)
export const appConfigFactory = (): AppConfig => {
  return appEnvSchema.parse(process.env);
};

// 4. Registration
const appConfig = registerAs<AppConfig>('app', appConfigFactory);

export default appConfig;
```

### 3 Zod validation at startup (fail fast)

- Validate env input before app start using a `validate` function with Zod
- Do not rely on Joi-only patterns when the project uses Zod
- Throw on invalid config to stop bootstrap early

Example:

```typescript
// src/config/env.validation.ts
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
});

export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }
  return result.data;
}
```

### 4 Preferred consumption style

- Prefer direct namespaced injection for type safety:
  - `@Inject(myConfig.KEY)`
  - `ConfigType<typeof myConfig>`
- Use `ConfigService` as an alternative when accessing multiple namespaces or dynamic contexts

Examples:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from '@/config/app.config';
import databaseConfig from '@/config/database.config';
import { validate } from '@/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      validate,
    }),
  ],
})
export class AppModule {}
```

```typescript
// Direct namespaced injection (preferred)
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import appConfig from '@/config/app.config';

@Injectable()
export class AppService {
  constructor(
    @Inject(appConfig.KEY)
    private readonly _appConfig: ConfigType<typeof appConfig>,
  ) {}

  getPort(): number {
    return this._appConfig.PORT;
  }
}
```

```typescript
// ConfigService alternative
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private readonly _configService: ConfigService) {}

  getRuntimeEnv(): string {
    return this._configService.get<string>('app.NODE_ENV', 'development');
  }
}
```

## Canonical workflow

1. Inspect existing config namespaces under `src/config/`.
2. Create or update `<name>.config.ts` with `registerAs`.
3. Extend env validation schema/function for new required vars.
4. Wire config in `ConfigModule.forRoot({ load: [...], validate })`.
5. Consume config with direct namespaced injection by default.
6. Ensure no direct `process.env` access remains in business services.

## Output expectations

When applying this skill, produce:

- Config file(s) in `src/config/`
- Updated env validation function/schema
- `ConfigModule` wiring updates (if required)
- Type-safe usage in services/modules

## Guardrails

- Never hardcode secrets
- Keep namespaces stable and meaningful (`app`, `database`, `auth`, etc.)
- Prefer minimal, focused config changes
- Keep code aligned with project lint/format rules

## Reference

For full examples and rationale, use:

- `docs/nestjs-config-pattern.md`
