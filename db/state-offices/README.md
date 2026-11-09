# State-office data

The Neon database holds independent import batches. The site reads only the checked-in `data/state-publication.json` snapshot. A null snapshot disables state-office listings.

Set `DATABASE_URL` to the intended Neon database. Check the target before running commands. A shell variable takes precedence over a Node `--env-file` value; unset it before using a different environment file. Keep credentials out of the repository.

```sh
npx tsx scripts/state-offices.ts migrate
python3 scripts/state-coverage.py reports/state-endorsement-gap-review.tsv /tmp/state-coverage.json
npx tsx scripts/state-offices.ts import /tmp/state-coverage.json
npx tsx scripts/state-offices.ts show BATCH_ID
npx tsx scripts/state-offices.ts check BATCH_ID
```

Import prints a content hash used as its batch ID. Importing the same data twice is idempotent. Imports run in one transaction. A batch can be edited in the database until review. `show` prints its records for review; `draft BATCH_ID PATH` exports an editable import file for creating a new batch. Each new source or correction must be checked against its evidence and saved gap register. `tsx scripts/roster-import.ts OUTPUT research_notes/roster/*.json` builds a batch from research files; states without one get `in_progress` coverage.

After a person reviews the entire batch, `review BATCH_ID REVIEWER` records their name and freezes it. Create a new batch for corrections. `check` requires reviewed records, a coverage row with a note for each of the 300 state/group combinations and a reconciliation for every discovered endorsement. Incoming winners remain separate from current officeholders. Unresolved terms can be stored but the site does not show them. Primary endorsements qualify only when their election points to the general or special election in the same cycle. Withdrawn endorsements do not qualify; appointments without an endorsement for the election that won the current term are excluded. Passing these checks is not proof that the research is complete; a reviewer must reconcile every discovered endorsement and source gap against the launch checks in the plan.

`publish BATCH_ID VERSION --confirm-gaps` creates an immutable snapshot after those checks. It does not deploy it. `export VERSION PATH` writes the snapshot without overwriting an existing file. After release review, replace `data/state-publication.json` with that export and commit it: the committed file pins the deployment. To restore an earlier publication, export its version and commit that file. `select VERSION` records a database selection but does not change the deployed site. Blocked and in-progress coverage is published and shown on each state page as not fully checked.
