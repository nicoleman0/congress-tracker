# Database recommendation

Research checked 8 November 2026 using Context7 and Neon's official documentation. Recommendation only; nothing provisioned or migrated.

## Why consider a database now?

### Takeaway

PostgreSQL on Neon is a reasonable direction for the expanded roster. The reason is relational data and controlled publishing, not evidence that JSON files are too large.

### Cited findings

- Gracchi currently imports roster, platform and portrait JSON in `lib/data.ts`; `lib/endorsements.ts` separately imports the 2028 file. Scheduled refresh workflows write JSON and automatically merge their changes. These are local source observations, not performance measurements. [Roster module](/Users/nicholas/dev/gracchi/lib/data.ts), [future endorsements](/Users/nicholas/dev/gracchi/lib/endorsements.ts), [refresh workflow](/Users/nicholas/dev/gracchi/.github/workflows/refresh.yml)
- Neon provides managed PostgreSQL, isolated branches and standard PostgreSQL export. [Branching](https://neon.com/docs/introduction/branching), [export](https://neon.com/docs/guides/export-neon-postgres-compatible)

### Inferences

- People, offices/seats, terms, elections, endorsers/chapters, endorsements and sources now have distinct relationships and lifetimes. Foreign keys, transactions and unique constraints would help enforce them.
- Larger files alone do not demonstrate a capacity problem. No benchmark or final roster size has been established.

### Gaps

- Precise schema, data volume, editing workflow and operating budget are not agreed.

## Recommended publication architecture

### Takeaway

Use Neon as the canonical editable store and publish a generated, versioned snapshot to the existing site. Do not keep independently editable JSON and database copies.

### Cited findings

- Neon supports isolated development/test branches and a Vercel integration that creates branches for previews. Branch changes are independent of their parent. [Branching](https://neon.com/docs/introduction/branching)

### Inferences

- Pipeline: source import → proposed batch → validation and reviewable diff → approved publication version → deterministic export → deployment pinned to that version.
- Record source identity, retrieved content hash, import batch and review outcome. Reimports must be idempotent; ambiguous people require review rather than name-based merging.
- Keep evidence, election results and service dates separate. The 2028 dataset remains a separate election scope within the same canonical model.
- A generated JSON snapshot is a deployment artifact, not a second authoring source. It preserves reproducible builds and public serving without a database request per visit.
- Direct server-side database reads are an alternative when immediate publishing or interactive queries justify them. They add runtime availability, connection and cache-invalidation work. Read only an approved publication version, not mutable import staging.

### Gaps

- Decide the snapshot location, publication approval mechanism and transition for existing automatic JSON refresh jobs. A schema migration and a reviewed data import are separate steps. No ORM or SDK choice is needed yet.

## Operations and reversibility

### Takeaway

Plan least-privilege access, preview isolation and tested exports before migration.

### Cited findings

- Neon recommends pooled connections for concurrent web applications and direct connections for migrations and `pg_dump`/`pg_restore`. [Pooling](https://neon.com/docs/connect/connection-pooling)
- SQL-created roles can receive selective object privileges; console/API-created roles may have broader privileges. [Roles](https://neon.com/docs/manage/roles)
- Recovery depends on the configured history window. Standard exports support moving to another PostgreSQL service. [Recovery](https://neon.com/docs/introduction/branching), [export](https://neon.com/docs/guides/export-neon-postgres-compatible)

### Inferences

- Separate read-only publication access from importer and migration credentials. Preview deployments must use preview branches and never write production.
- Retain approved snapshots for site rollback, database revision history for corrections and tested PostgreSQL exports for recovery. Preview branches do not replace publication review.
- Estimate compute, storage, history, transfer and preview-branch costs; expire unused branches. No fixed cost estimate is justified yet. [Current pricing](https://neon.com/pricing)

### Gaps

- Choose plan, region and retention after measuring the audited workload. Finish source discovery before provisioning.
