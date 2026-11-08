# Federal mirror and analysis views

`federal` is a read-only copy of `data/members.json`, `platform.json`, `photos.json` and `endorsements-2028.json` for analysis. The JSON stays canonical; the site never reads Neon.

```sh
DATABASE_URL=... npx tsx scripts/federal-mirror.ts load
```

`load` applies pending migrations for `state_offices`, `federal` and `analysis`, then mirrors the data files as of their last commit. It refuses uncommitted changes or a commit not yet on `origin/main`. Each distinct content is stored once (`federal.loads`); `federal.syncs` records which load each commit had. `federal.latest` is the most recent sync.

The `Mirror data to Neon` workflow runs `load` on pushes to `main` and daily after the refresh. It needs the Neon direct connection string as the `NEON_DATABASE_URL` repository secret.

Query through `analysis.officeholders` and `analysis.endorsements`. Federal rows come from `federal.latest`; state rows come from the selected state publication only. Group codes are lowercased; status values differ by level.

A new field in the JSON makes `load` fail until it is added to `db/federal` and `scripts/federal-mirror.ts`.
