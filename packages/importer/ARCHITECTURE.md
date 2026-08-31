# Story importer boundaries

The importer is a shared backend package. Next.js UI code and BullMQ consumers
must depend on its public exports, not on Prisma or source-specific details.

## Layers

- `domain/`: validation, public errors, and pure chapter-content rules.
- `application/`: use cases invoked by the admin DAL or workers.
- `infrastructure/persistence/`: Prisma queries and persistence DTO mapping.
- `infrastructure/sources/`: source adapters and HTTP/browser transports.
- `infrastructure/queue/`: BullMQ producers, queue names, and Redis health state.
- `worker/`: queue-consumer orchestration. It contains no UI or Next.js code.

Root files such as `schemas.js` and `import-queue.js` are compatibility facades.
Existing package subpath exports remain stable while callers migrate to the new
layout. New implementation code belongs in the layer directories above.

## Request flow

```text
Admin route -> server action/route handler -> server-only DAL
            -> importer application service -> domain + infrastructure

BullMQ -> worker service -> source adapter + persistence -> PostgreSQL
```

PostgreSQL is the canonical job state. Redis stores queue/lock/short-lived source
health data only. The browser polls a DTO route and never imports Prisma code.
