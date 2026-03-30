# NestJS Fastify API Boilerplate

Production-ready REST API boilerplate built with NestJS, Fastify, Prisma, and Zod.

## Why this boilerplate

- Modular feature-first architecture (`Controller -> Service -> Repository`)
- Fast HTTP server with Fastify
- Type-safe request/response contracts with Zod + `nestjs-zod`
- PostgreSQL persistence with Prisma
- Structured logging with `nestjs-pino`
- Unit and E2E testing with Jest + Supertest
- GitHub-ready automation (CI, CodeQL, Dependabot, templates)

## Tech stack

- `nestjs` 11
- `fastify` 5
- `prisma` 7
- `zod` 4
- `jest` 30
- `pnpm`

## Project status

Current version: `0.1.0-alpha.1`

This project is in active development and not considered stable yet.

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment setup

```bash
cp .env.example .env
```

Update `.env` values for your local setup.

### 3. Run in development mode

```bash
pnpm start:dev
```

## Available scripts

```bash
pnpm lint
pnpm format
pnpm test
pnpm test:unit
pnpm test:e2e
pnpm build
```

## Database (Prisma)

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:migrate:deploy
pnpm prisma:seed
pnpm prisma:studio
```

## API design conventions

- Validate all incoming inputs with Zod DTOs
- Serialize responses with `@ZodSerializerDto(...)`
- Never return raw database entities directly
- Keep persistence code under `src/modules/database/**`

## Folder structure

```text
src/
  modules/
    users/
    settings/
    health/
    email/
    database/
test/
  modules/
```

## Contributing

- Use `pnpm` for all commands
- Keep changes focused and production-safe
- Add or update tests for behavior changes
- Follow PR and issue templates in `.github/`

## License

MIT. See [LICENSE](./LICENSE).
