# Software Architecture

This document describes the software architecture of this serverless API. It is intended for an AI agent that needs to replicate the same architecture in a different project.

---

## Philosophy

The architecture combines three ideas:

1. **Clean Architecture** — business logic is completely isolated from infrastructure. The `application` layer never imports from `infra`. Infrastructure depends on the application, never the other way around.
2. **Decorator-based Dependency Injection** — instead of a DI framework, a lightweight custom container uses TypeScript decorators and `reflect-metadata` to wire dependencies at runtime.
3. **Adapter pattern for Lambda triggers** — a thin adapter layer converts any Lambda event type (HTTP, SQS, S3) into a normalized interface consumed by the application layer.

---

## Folder Structure

```
src/
├── application/          # Pure business logic. Zero AWS/infra imports.
│   ├── contracts/        # Abstract base classes and interfaces (Controller, IQueueConsumer, IFileEventHandler)
│   ├── controllers/      # HTTP request handlers — one class per route
│   │   └── <domain>/
│   │       ├── <Name>Controller.ts
│   │       └── schemas/  # Zod schemas for request body validation
│   ├── entities/         # Domain models (plain classes, no ORM annotations)
│   ├── errors/
│   │   ├── ErrorCode.ts          # Enum of all error codes
│   │   ├── application/          # Domain errors (extend ApplicationError)
│   │   └── http/                 # HTTP-specific errors (extend HttpError)
│   ├── events/           # S3 / file event handlers
│   ├── query/            # CQRS read side — cross-entity queries
│   ├── queues/           # SQS message consumers
│   ├── services/         # Stateless domain services (pure calculation logic)
│   └── useCases/         # One use case class per business operation
│       └── <domain>/
│
├── infra/                # All AWS and external-service code lives here
│   ├── ai/
│   │   ├── gateways/     # AI provider gateway
│   │   └── prompts/      # Prompt builder functions
│   ├── clients/          # Singleton AWS SDK client instances
│   ├── database/dynamo/
│   │   ├── items/        # DynamoDB item mappers (entity ↔ DynamoDB record)
│   │   ├── repositories/ # Write-side repositories (one per entity)
│   │   └── uow/          # Unit of Work implementations
│   ├── emails/
│   │   └── templates/    # React Email components
│   └── gateways/         # External service integrations (Auth, Storage, Queue)
│
├── kernel/               # The DI micro-framework. Never changes between projects.
│   ├── decorators/
│   │   ├── Injectable.ts # @Injectable() class decorator
│   │   └── Schema.ts     # @Schema(zodSchema) class decorator
│   └── di/
│       ├── Registry.ts   # Singleton DI container
│       └── container.ts  # Exports `container` = Registry.getInstance()
│
├── main/                 # Lambda entry points only. No business logic.
│   ├── adapters/
│   │   ├── lambdaHttpAdapter.ts  # HTTP API Gateway v2 → Controller
│   │   ├── lambdaSqsAdapter.ts   # SQS event → IQueueConsumer
│   │   └── lambdaS3Adapter.ts    # S3 event → IFileEventHandler
│   ├── functions/        # One file per Lambda. Each file exports `handler`.
│   │   └── <domain>/
│   └── utils/
│       ├── lambdaBodyParser.ts   # Parses raw Lambda event body
│       └── lambdaErrorResponse.ts
│
├── shared/               # Cross-cutting concerns with no layer preference
│   ├── config/
│   │   ├── env.ts        # Zod-validated process.env schema
│   │   └── AppConfig.ts  # Injectable config wrapper over env.ts
│   ├── saga/
│   │   └── saga.ts       # Saga pattern for compensating transactions
│   ├── types/
│   │   └── Constructor.ts
│   └── utils/
│
└── utils/                # Pure utility helpers (no layer awareness)
```

---

## Layer Rules

| Layer | May import from | Must NOT import from |
|---|---|---|
| `application` | `shared`, `kernel` | `infra`, `main` |
| `infra` | `application`, `shared`, `kernel` | `main` |
| `main` | `application`, `infra`, `kernel`, `shared` | — |
| `kernel` | `shared` | `application`, `infra`, `main` |
| `shared` | nothing | everything else |

---

## The DI Container (`kernel/`)

### How it works

The container is a singleton `Registry` that stores a map of `className → { constructor, constructorParamTypes[] }`. When `@Injectable()` is applied to a class, it registers itself. When `resolve(SomeClass)` is called, the registry recursively instantiates all constructor dependencies.

```typescript
// kernel/di/Registry.ts
export class Registry {
    private static instance: Registry | undefined;
    private readonly providers = new Map<string, Registry.Provider>();

    register(impl: Constructor) {
        const paramTypes = Reflect.getMetadata("design:paramtypes", impl) ?? [];
        this.providers.set(impl.name, { impl, deps: paramTypes });
    }

    resolve<T extends Constructor>(impl: T): InstanceType<T> {
        const provider = this.providers.get(impl.name);
        const deps = provider.deps.map((dep) => this.resolve(dep));
        return new provider.impl(...deps);
    }
}
```

This relies on `emitDecoratorMetadata: true` in `tsconfig.json`, which makes TypeScript emit constructor parameter type information as `design:paramtypes` metadata readable at runtime via `reflect-metadata`.

### `@Injectable()` decorator

```typescript
// kernel/decorators/Injectable.ts
export function Injectable(): ClassDecorator {
    return (target) => {
        Registry.getInstance().register(target as unknown as Constructor);
    };
}
```

Apply `@Injectable()` to every class you want the container to manage: controllers, use cases, repositories, gateways, services, `AppConfig`, `Saga`, etc.

**Important**: A new instance is created on every `resolve()` call — the registry does not cache singletons. This is intentional for Lambda: each invocation starts fresh with no shared state between requests.

### `@Schema()` decorator

```typescript
// kernel/decorators/Schema.ts
export function Schema(schema: z.ZodSchema): ClassDecorator {
    return (target) => {
        Reflect.defineMetadata("custom:schema", schema, target);
    };
}

export function getSchema(target: any): z.ZodSchema | undefined {
    return Reflect.getMetadata("custom:schema", target.constructor);
}
```

Attaches a Zod schema to a controller class via metadata. `Controller.execute()` reads this metadata and validates the request body before calling `handle()`. Note: `target.constructor` must be used (not just `target`) because the metadata is read from an instance, not the class definition.

### Lambda entry points

Every Lambda handler file is identical in structure:

```typescript
// main/functions/<domain>/<name>.ts
import "reflect-metadata";   // MUST be the first import
import { SomeController } from "@application/controllers/...";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(SomeController);
```

`reflect-metadata` must be imported first to initialize the metadata system before any decorated class is loaded.

---

## The Controller Pattern

### Abstract base class

```typescript
// application/contracts/Controller.ts
export abstract class Controller<TType extends "public" | "private", TBody = undefined> {
    public execute(request: Controller.Request<TType>): Promise<Controller.Response<TBody>> {
        const body = this.validateBody(request.body);  // uses @Schema metadata
        return this.handle({ ...request, body });
    }

    protected abstract handle(params: Controller.Request<TType>): Promise<Controller.Response<TBody>>;
}
```

The `TType` generic enforces at the type level whether a controller is public or private:
- `Controller<"public">` → `request.accountId` is `null`
- `Controller<"private">` → `request.accountId` is `string`

### A concrete controller

```typescript
@Injectable()
@Schema(signUpSchema)          // attaches Zod schema for body validation
export class SignUpController extends Controller<"public", SignUpController.Response> {
    constructor(private readonly signUpUseCase: SignUpUseCase) {
        super();
    }

    protected override async handle({ body }: Controller.Request<"public", SignUpBody>) {
        const { accessToken, refreshToken } = await this.signUpUseCase.execute(body);
        return { statusCode: 201, body: { accessToken, refreshToken } };
    }
}

export namespace SignUpController {
    export type Response = { accessToken: string; refreshToken: string };
}
```

Note the `namespace` co-located with the class. This is the convention throughout the codebase for defining input/output types specific to a class.

### The HTTP adapter

```typescript
// main/adapters/lambdaHttpAdapter.ts
export function lambdaHttpAdapter(controllerImpl: Constructor<Controller<any>>) {
    return async (event: APIGatewayProxyEventV2 | APIGatewayProxyEventV2WithJWTAuthorizer) => {
        try {
            const controller = Registry.getInstance().resolve(controllerImpl);

            const accountId = "authorizer" in event.requestContext
                ? event.requestContext.authorizer.jwt.claims.internalId as string
                : null;

            const response = await controller.execute({
                body: lambdaBodyParser(event.body),
                params: event.pathParameters ?? {},
                queryParams: event.queryStringParameters ?? {},
                accountId,
            });

            return { statusCode: response.statusCode, body: JSON.stringify(response.body) };
        } catch (error) {
            if (error instanceof ZodError) { /* 400 */ }
            if (error instanceof ApplicationError) { /* error.statusCode */ }
            if (error instanceof HttpError) { /* error.statusCode */ }
            /* 500 */
        }
    };
}
```

The adapter is the **only place** that knows about the Lambda event shape. It extracts the `accountId` from the JWT claims (`internalId` custom claim) if the event has an authorizer, or passes `null` for public routes.

---

## SQS and S3 Adapters

The same adapter pattern applies to other Lambda trigger types.

### SQS adapter

```typescript
// application/contracts/IQueueConsumer.ts
export interface IQueueConsumer<TMessage extends Record<string, unknown>> {
    process(message: TMessage): Promise<void>;
}

// main/adapters/lambdaSqsAdapter.ts
export function lambdaSQSAdapter(consumerImpl: Constructor<IQueueConsumer<any>>): SQSHandler {
    return async (event) => {
        const consumer = Registry.getInstance().resolve(consumerImpl);
        await Promise.all(event.Records.map(r => consumer.process(JSON.parse(r.body))));
    };
}
```

### S3 adapter

```typescript
// application/contracts/IFileEventHandler.ts
export interface IFileEventHandler {
    handle(input: { fileKey: string }): Promise<void>;
}

// main/adapters/lambdaS3Adapter.ts
export function lambdaS3Adapter(eventHandlerImpl: Constructor<IFileEventHandler>): S3Handler {
    return async (event) => {
        const handler = Registry.getInstance().resolve(eventHandlerImpl);
        const responses = await Promise.allSettled(
            event.Records.map(r => handler.handle({ fileKey: r.s3.object.key }))
        );
        // log failed events without throwing
    };
}
```

---

## Use Cases

Each use case is an `@Injectable()` class with a single `execute()` method. It orchestrates repositories, gateways, and domain services. It never imports AWS SDK directly.

```typescript
@Injectable()
export class SignUpUseCase {
    constructor(
        private readonly authGateway: AuthGateway,
        private readonly accountRepository: AccountRepository,
        private readonly signUpUow: SignUpUnitOfWork,
        private readonly saga: Saga,
    ) {}

    async execute(input: SignUpUseCase.Input): Promise<SignUpUseCase.Output> {
        return this.saga.run(async () => {
            // 1. Check preconditions via repository
            // 2. Construct domain entities
            // 3. Call external service (gateway), register compensation
            // 4. Persist via Unit of Work
            // 5. Return result
        });
    }
}
```

### Co-located Input/Output types

Every use case (and query, gateway, etc.) defines its types in a co-located `namespace` with the same name as the class:

```typescript
export namespace SignUpUseCase {
    export type Input = { ... };
    export type Output = { ... };
}
```

This keeps types next to their consumer without creating separate type files.

---

## Domain Entities

Plain TypeScript classes. No ORM annotations, no serialization logic. They auto-generate a KSUID if no `id` is provided.

```typescript
export class Account {
    readonly id: string;
    readonly email: string;
    externalId: string | undefined;
    createdAt: Date;

    constructor(attr: Account.Attributes) {
        this.id = attr.id ?? KSUID.randomSync().string;
        this.email = attr.email;
        this.externalId = attr.externalId;
        this.createdAt = attr.createdAt ?? new Date();
    }
}

export namespace Account {
    export type Attributes = {
        email: string;
        externalId?: string;
        id?: string;
        createdAt?: Date;
    };
}
```

**Key rule**: `id` and `createdAt` are optional in `Attributes` so the entity can be constructed either from scratch (new record) or from a database record.

---

## Repository Pattern

One repository per entity, responsible for writes only. Repositories are `@Injectable()` and receive `AppConfig` for the table name.

```typescript
@Injectable()
export class AccountRepository {
    constructor(private readonly appConfig: AppConfig) {}

    async findByEmail(email: string): Promise<Account | null> { ... }

    // Returns the raw PutCommandInput so the UoW can batch it
    getPutCommandInput(account: Account): PutCommandInput {
        return {
            TableName: this.appConfig.db.dynamodb.mainTableName,
            Item: AccountItem.fromEntity(account).toItem(),
        };
    }

    async create(account: Account): Promise<void> {
        await dynamoClient.send(new PutCommand(this.getPutCommandInput(account)));
    }
}
```

The `getPutCommandInput()` method is important: it exposes the raw command input so a Unit of Work can include the put in a transaction without executing it individually.

---

## DynamoDB Item Mappers

Item classes handle the translation between domain entities and DynamoDB records. They encapsulate the PK/SK key construction logic.

```typescript
export class AccountItem {
    static readonly type = "Account";

    constructor(private readonly attr: AccountItem.Attributes) {
        this.keys = {
            PK: AccountItem.getPk(attr.id),
            SK: AccountItem.getSK(attr.id),
            GSI1PK: AccountItem.getGSI1PK(attr.email),
            GSI1SK: AccountItem.getGSI1SK(attr.email),
        };
    }

    toItem(): AccountItem.ItemType {
        return { ...this.keys, type: AccountItem.type, ...this.attr };
    }

    static fromEntity(account: Account): AccountItem { ... }
    static toEntity(item: AccountItem.ItemType): Account { ... }

    static getPk(accountId: string) { return `ACCOUNT#${accountId}`; }
    static getSK(accountId: string) { return `ACCOUNT#${accountId}`; }
    static getGSI1PK(email: string) { return `ACCOUNT#${email}`; }
    static getGSI1SK(email: string) { return `ACCOUNT#${email}`; }
}

export namespace AccountItem {
    export type Keys = { PK: `ACCOUNT#${string}`; SK: `ACCOUNT#${string}`; ... };
    export type Attributes = { id: string; email: string; ... };
    export type ItemType = Keys & Attributes & { type: "Account" };
}
```

The static key methods are public so repositories and query classes can construct key expressions without instantiating the item.

### DynamoDB single-table key patterns used

| Entity | PK | SK | GSI1PK | GSI1SK |
|---|---|---|---|---|
| Account | `ACCOUNT#<id>` | `ACCOUNT#<id>` | `ACCOUNT#<email>` | `ACCOUNT#<email>` |
| Profile | `ACCOUNT#<accountId>` | `ACCOUNT#<accountId>#PROFILE` | — | — |
| Goal | `ACCOUNT#<accountId>` | `ACCOUNT#<accountId>#GOAL` | — | — |
| Meal | `ACCOUNT#<accountId>#MEAL#<mealId>` | `ACCOUNT#<accountId>#MEAL#<mealId>` | `MEALS#<accountId>#YYYY-MM-DD` | `MEAL#<mealId>` |

The shared `PK = ACCOUNT#<accountId>` for Profile and Goal allows fetching both in one query with `begins_with(SK, "ACCOUNT#<accountId>#")`.

---

## CQRS: Query Classes

When a read operation needs data from more than one entity, a dedicated query class is used instead of a repository. Query classes do not create domain entity instances — they return plain data objects directly, which avoids the overhead of entity construction and keeps reads lightweight.

```typescript
@Injectable()
export class GetProfileAndGoalQuery {
    constructor(private readonly appConfig: AppConfig) {}

    async execute({ accountId }: Input): Promise<Output> {
        // single DynamoDB query across Profile and Goal items
        // returns a plain object, not entity instances
    }
}
```

Query classes live in `application/query/` and may import DynamoDB item classes from `infra/` for key construction. This is the only place in the `application` layer that touches infra-specific key logic — it is an accepted trade-off for query efficiency.

---

## Unit of Work Pattern

For operations that must persist multiple entities atomically, a Unit of Work batches `PutCommandInput` objects and executes them as a DynamoDB `TransactWrite`.

```typescript
// Abstract base
export abstract class UnitOfWork {
    private transactItems: TransactWriteCommandInput["TransactItems"] = [];

    protected addPut(putInput: PutCommandInput) {
        this.transactItems.push({ Put: putInput });
    }

    protected async commit() {
        await dynamoClient.send(new TransactWriteCommand({ TransactItems: this.transactItems }));
    }
}

// Concrete implementation
@Injectable()
export class SignUpUnitOfWork extends UnitOfWork {
    constructor(
        private readonly profileRepo: ProfileRepository,
        private readonly accountRepo: AccountRepository,
        private readonly goalRepo: GoalRepository,
    ) { super(); }

    async run({ account, goal, profile }: RunParams) {
        this.addPut(this.accountRepo.getPutCommandInput(account));
        this.addPut(this.profileRepo.getPutCommandInput(profile));
        this.addPut(this.goalRepo.getPutCommandInput(goal));
        await this.commit();
    }
}
```

Each concrete UoW receives the relevant repositories via DI and calls their `getPutCommandInput()` method to collect the operations before committing.

---

## Saga Pattern (Compensating Transactions)

When an operation spans multiple external systems (e.g., Cognito + DynamoDB), the `Saga` class manages rollbacks. Compensations are registered after each successful step and executed in reverse order on failure.

```typescript
@Injectable()
export class Saga {
    private compensations: (() => Promise<void>)[] = [];

    addCompensation(fn: () => Promise<void>) {
        this.compensations.unshift(fn); // prepend so last-registered runs first
    }

    async run<T>(fn: () => Promise<T>): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            await this.compensate();
            throw error;
        }
    }

    private async compensate() {
        for (const fn of this.compensations) {
            try { await fn(); } catch { /* log and continue */ }
        }
    }
}
```

Usage in a use case:

```typescript
return this.saga.run(async () => {
    const { externalId } = await this.authGateway.signUp(...);

    // If anything after this line throws, deleteUser will be called
    this.saga.addCompensation(() => this.authGateway.deleteUser({ externalId }));

    await this.signUpUow.run(...); // if this throws, Cognito user is cleaned up
});
```

Since `Saga` is `@Injectable()` and a new instance is created per `resolve()` call, there is no state leakage between requests.

---

## Gateway Pattern

Gateways wrap external services. They are `@Injectable()` and receive `AppConfig` for configuration. The application layer depends on the concrete gateway classes directly (no interface abstraction layer), keeping the code simple.

```typescript
@Injectable()
export class AuthGateway {
    constructor(private readonly appConfig: AppConfig) {}

    async signUp(params: AuthGateway.SignUpParams): Promise<AuthGateway.SignUpResult> { ... }
    async signIn(params: AuthGateway.SignInParams): Promise<AuthGateway.SignInResult> { ... }
    async deleteUser(params: AuthGateway.DeleteUserParams): Promise<void> { ... }
    // ...
}

export namespace AuthGateway {
    export type SignUpParams = { email: string; password: string; internalId: string };
    export type SignUpResult = { externalId: string };
    // ...
}
```

---

## Error Handling

### Error class hierarchy

```
Error (built-in)
├── ApplicationError (abstract)      — domain errors with a machine-readable code
│   ├── EmailAlreadyInUse            — 409
│   └── ResourceNotFound             — 404
└── HttpError                        — HTTP-level errors
    └── BadRequest                   — 400
```

```typescript
// Abstract base
export abstract class ApplicationError extends Error {
    public statusCode?: number;
    abstract code: ErrorCode;  // enum value
}

// Concrete error
export class EmailAlreadyInUse extends ApplicationError {
    public override statusCode = 409;
    override code = ErrorCode.EMAIL_ALREADY_IN_USE;

    constructor() {
        super();
        this.name = "EmailAlreadyInUse";
        this.message = "This email is already in use.";
    }
}
```

### Error codes enum

All machine-readable error codes live in a single enum:

```typescript
export enum ErrorCode {
    VALIDATION = "VALIDATION",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    BAD_REQUEST = "BAD_REQUEST",
    EMAIL_ALREADY_IN_USE = "EMAIL_ALREADY_IN_USE",
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
}
```

The HTTP adapter catches all error types and maps them to structured JSON responses.

---

## Configuration (`AppConfig`)

Environment variables are validated at startup with Zod in `shared/config/env.ts`. `AppConfig` is an `@Injectable()` class that wraps the validated env object and groups config by domain.

```typescript
// shared/config/env.ts
export const env = envSchema.parse(process.env); // throws on startup if vars are missing

// shared/config/AppConfig.ts
@Injectable()
export class AppConfig {
    public readonly auth: AppConfig.Auth;
    public readonly db: AppConfig.Database;

    constructor() {
        this.auth = { cognito: { clientId: env.COGNITO_CLIENT_ID, ... } };
        this.db = { dynamodb: { mainTableName: env.MAIN_TABLE_NAME } };
    }
}
```

Any class that needs config receives `AppConfig` via constructor injection. No direct `process.env` access outside `env.ts`.

---

## Build Configuration Requirements

Because the codebase uses `emitDecoratorMetadata`, esbuild alone cannot compile it — esbuild does not emit TypeScript metadata. The project uses `esbuild-plugin-tsc` to run `tsc` first for metadata generation, then esbuild for bundling.

Key `tsconfig.json` settings required:
```json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    }
}
```

Key `serverless.yml` esbuild plugin config:
```yaml
custom:
    esbuild:
        plugins: esbuild.config.mjs
```

```javascript
// esbuild.config.mjs
import { tscPlugin } from "esbuild-plugin-tsc";

export default [
    tscPlugin({ force: true })
];
```

---

## Checklist for Replicating This Architecture

When starting a new serverless project with this architecture:

- [ ] Install `reflect-metadata`, `zod`, `ksuid`, `esbuild-plugin-tsc`
- [ ] Set `experimentalDecorators: true` and `emitDecoratorMetadata: true` in `tsconfig.json`
- [ ] Configure esbuild with `esbuild-plugin-tsc`
- [ ] Copy `kernel/` verbatim (`Registry.ts`, `Injectable.ts`, `Schema.ts`, `container.ts`)
- [ ] Copy `shared/saga/saga.ts` verbatim
- [ ] Copy the three adapters: `lambdaHttpAdapter.ts`, `lambdaSqsAdapter.ts`, `lambdaS3Adapter.ts`
- [ ] Copy `application/contracts/Controller.ts`, `IQueueConsumer.ts`, `IFileEventHandler.ts`
- [ ] Copy `application/errors/` structure (`ApplicationError`, `HttpError`, `ErrorCode` enum)
- [ ] Create `shared/config/env.ts` (Zod-validated env schema) and `AppConfig.ts` (`@Injectable()` wrapper)
- [ ] Every Lambda handler file must have `import "reflect-metadata"` as its **first** import
- [ ] Every class that participates in DI must have `@Injectable()`
- [ ] Controllers use `@Schema(zodSchema)` for body validation and extend `Controller<"public"|"private">`
- [ ] Repositories expose `getPutCommandInput()` for UoW compatibility
- [ ] Item classes encapsulate all key construction logic as static methods
- [ ] Use case types (Input/Output) are defined in a co-located namespace
