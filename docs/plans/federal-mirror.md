# Federal data mirror in Neon

Goal: query congressional and state-office data together in Neon for analysis. The JSON files in `data/` stay canonical; the site and the six writer scripts do not change.

## Decisions

- **Read-only mirror.** `scripts/federal-mirror.ts load` copies `members.json`, `platform.json`, `photos.json` and `endorsements-2028.json` into a `federal` schema. Nothing writes back to JSON.
- **Keep every distinct load.** Each load is keyed by the SHA-256 of its canonical content, like state batches. Loading unchanged data is a no-op. Older loads stay for trend queries.
- **Provenance.** Each sync records the last commit that touched the data files and which load it had, so reverting content still moves `latest`. Loading refuses when the mirrored files have uncommitted changes, so every load maps to a commit.
- **Validation.** The loader validates through `lib/data.ts` and `lib/endorsements.ts`, the same rules the build uses. Bad data fails before touching the database.
- **Shared migration runner.** Extract the state migration runner into `scripts/db.ts` without changing its behavior or hashes, then reuse it for `federal`.
- **Analysis views** in an `analysis` schema:
  - `federal.latest` names the load of the newest sync.
  - `analysis.officeholders`: one row per person and seat across federal (latest load) and state (the batch behind the selected publication). Columns: level, id, name, state, office, chamber, district, status, endorsing groups (lowercased codes).
  - `analysis.endorsements`: one row per person, group and level.
- **Sync.** A `mirror.yml` workflow loads on pushes to `main` that touch the mirrored files. It needs a `NEON_DATABASE_URL` repository secret, added by the user.

## Steps

1. Extract `scripts/db.ts` (transaction, migrate). State tests and the local migrate must still pass with unchanged hashes.
2. Add `db/federal/001.sql`: loads, groups, members, member_groups, issues, stances, photos, candidates_2028, candidate_endorsements_2028. Rows are immutable once loaded.
3. Write the loader: migrate, validate, hash, insert in one transaction.
4. Tests: idempotent load, distinct content makes a new load, dirty-tree refusal, row counts match JSON. DB tests run against `STATE_TEST_DATABASE_URL`.
5. Add `db/analysis/001.sql` with the analysis views. Test them against the local DB with a state fixture.
6. Load to Neon and check counts against the JSON.
7. Add `mirror.yml`; document in `db/federal/README.md`.

## Out of scope

Moving any writer to Neon, dashboards, public analysis pages.
