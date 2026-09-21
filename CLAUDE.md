# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Type checking
pnpm typecheck

# Deploy full stack
sls deploy

# Deploy a single function
sls deploy function -f <function_name>

# Tail CloudWatch logs for a function
sls logs -f <function_name> -t

# Dev server for email templates
pnpm dev:email

# Run a script with tsx (e.g., manual testing)
npx tsx scripts/createMeal.ts
```

There is no test runner configured in this project.

## Architecture

This is a **serverless TypeScript API** (AWS Lambda + API Gateway v2) for a food diary / nutrition tracking app. It follows **Clean Architecture** with **Decorator-based Dependency Injection**.

### Layer Structure (`src/` path aliases)

| Alias | Purpose |
|---|---|
| `@application` | Business logic: controllers, use cases, entities, queries, services |
| `@kernel` | DI container (`Registry`), `@Injectable` and `@Schema` decorators |
| `@infra` | AWS clients, DynamoDB repos, gateways (Cognito, S3, SQS, OpenAI), email templates |
| `@main` | Lambda entry points, HTTP/SQS/S3 event adapters |
| `@shared` | `AppConfig` (env vars), Saga pattern, shared types |
| `@utils` | General helpers |

### Request Flow

```
Lambda Event
  → lambdaHttpAdapter (src/main/adapters/)
  → Controller.execute()           ← validates body via @Schema(zodSchema) decorator
  → Controller.handle()            ← resolves dependencies via Registry
  → Use Case / Gateways / Repos
  → {statusCode, body}
```

- **Controllers** are in `src/application/controllers/` (split into `public/` and `private/`)
- **Private routes** receive `accountId` from the Cognito JWT `internalId` claim (injected by the `preTokenGenerationTrigger` Lambda)
- **Error handling**: `ZodError` → 400, `ApplicationError` / `HttpError` → configured status, unhandled → 500

### Dependency Injection

Classes decorated with `@Injectable()` are registered in a singleton `Registry`. Dependencies are resolved at runtime via `reflect-metadata` constructor type introspection. The `@Schema(zodSchema)` decorator attaches a Zod schema to a controller class for request body validation.

### Repository / CQRS Pattern

- One repository per entity (`AccountRepository`, `ProfileRepository`, `GoalRepository`, `MealRepository`) — handles writes only
- **Query classes** (`src/application/query/`) handle reads that span multiple entities, avoiding the overhead of instantiating domain entities for read-only operations
- `SignUpUnitOfWork` batches account + profile + goal creation into a single DynamoDB `TransactWrite`

### Saga Pattern

`Saga` (`src/shared/saga/`) manages compensating transactions — when a multi-step operation fails partway through, registered rollback actions execute in reverse order.

### Meal Processing Pipeline

```
POST /meals (createMeal)
  → returns presigned S3 POST URL to client

Client uploads file to S3
  → S3 event triggers onMealFileUploaded Lambda
  → publishes message to SQS MealsQueue

processMeal Lambda (SQS consumer, 1GB RAM, 2min timeout)
  → calls OpenAI (vision or audio) with structured Zod output schema
  → persists extracted nutrition data to DynamoDB
  → Meal status: UPLOADING → QUEUED → PROCESSING → SUCCESS | FAILED
```

### DynamoDB Design

Single table (`foodiary-api-{stage}-MainTable`):
- **PK** / **SK** — primary access
- **GSI1** (`GSI1PK` / `GSI1SK`) — supports email lookups and date-range meal queries

DynamoDB item classes in `src/infra/database/dynamo/items/` map domain entities to PK/SK/GSI attribute patterns.

### Infrastructure

Managed by **Serverless Framework** (`serverless.yml` + `sls/` directory):
- Runtime: Node.js 22.x, default 128MB RAM
- Bundler: esbuild with `esbuild-plugin-tsc` (needed for `emitDecoratorMetadata`)
- AWS services: Cognito (auth), DynamoDB, S3 + CloudFront, SQS, SES, Lambda, API Gateway HTTP v2
- Custom domain setup is conditional on `API_DOMAIN_NAME` and `ROUTE53_HOSTED_ZONE_ID` env vars
- Environment variables are defined in `sls/config/env.yml`

### Cognito Notes

- Custom `internalId` attribute added to User Pool schema — propagated into JWT via `preTokenGenerationTrigger`
- Default Cognito email limit: **50 emails/day** per AWS account (sandbox). Production requires moving SES out of sandbox.
- Cognito authorizer acts as middleware on API Gateway — private Lambdas never execute if the JWT is invalid

### Email Templates

React Email components in `src/infra/emails/templates/`. Run `pnpm dev:email` to preview them in a browser.
