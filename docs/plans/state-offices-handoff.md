# Implementation handoff: governors and state legislators

Repository: `/Users/nicholas/dev/gracchi`. Prepared 8 November 2026.

## Read first

- `AGENTS.md`, including the requirement to read relevant installed Next.js guides before writing code.
- [Feature plan](state-offices.md): authoritative agreed scope, proposed listing rules and launch checks.
- [Latest audit summary](../../reports/State%20endorsement%20gap%20review.md) and [coverage matrix](../../reports/state-endorsement-gap-review.tsv).
- [Detailed research](../../research_notes/State%20endorsement%20gap%20review/): consult only the relevant group's notes and gap register. Do not repeat the nationwide audit.

The user flagged research usage as expensive. Keep work scoped, reuse saved evidence, and avoid parallel agents or further broad discovery unless requested. No implementation, database provisioning or migration was performed for this feature.

## Agreed decisions

- Cover governors and state legislators across all 50 states. Public launch requires all qualifying officials nationwide, not a pilot roster.
- Qualifying groups: WFP, Our Revolution, DSA, Run for Something, PCCC and Sunrise, including verified official state/local chapters. Attribute the actual issuer.
- An endorsement from the election that won a sitting official's current term counts, even before 2026. It does not qualify a later term automatically.
- State-only organizations require a separate agreed list. Congressional eligibility rules stay unchanged.
- Neon PostgreSQL is the canonical editable store. Publish reviewed, versioned snapshots for the site. Generated JSON is not independently editable.
- State voting-record ingestion, address lookup and automated platform collection are deferred.

## Research limits that must carry forward

Source availability is not a verified roster. No state has completed current-term, service and election-result reconciliation. Governor coverage and the Our Revolution chapter census remain incomplete.

- DSA directory and current/historical tables are recovered. Separate chapters from organizing committees; the latter are not automatically covered by the chapter rule. The broad State category includes an out-of-scope office.
- WFP's expanded lists and all 19 state pages were inspected. Dated pages can link to mutable current lists, so publication date alone does not establish historical contents.
- Our Revolution: 21 ORMA newsletters remain inaccessible; 19 partial-context screens are not full-source reviews. Conditional Wisconsin affiliate evidence is not confirmed affiliation.
- RFS: the General Assembly classifier omission is corrected. The 535 headline total remains unreconciled; five proposed name aliases are unmerged and six release-only candidacies remain open.
- PCCC: do not treat every champions-list entry as an endorsement. Reliable primary reporting quoting an authorized organization representative can verify an endorsement; issuer-domain hosting is not required.
- Never infer a win from an endorsement, congratulations message or primary result. Preserve unresolved evidence instead of treating it as an empty state.

The plan's rules for incoming officials, primary endorsements, withdrawals, appointments and excluded offices remain proposed details. Resolve material cases before publishing affected records; do not silently present them as user-approved policy.

## Implementation sequence

1. Inspect the current checkout and preserve unrelated work. During preparation, the branch was `codex/footer-art` and the latest inspected commit was `27d1457` (footer artwork); planning/research directories were untracked. Recheck live status. Do not switch branches, discard changes or include unrelated work blindly.
2. Define the smallest relational schema needed for people, offices/seats, terms, elections, endorsers/chapters, endorsements, sources, import batches and publication versions. Keep election, endorsement and service dates separate. Preserve existing IDs and URLs; support nonnumeric districts, multi-member districts and unicameral legislatures.
3. Follow current Vercel Marketplace/Neon guidance for actual provisioning when implementation is authorized. No database exists from this task. Choose region and environment isolation, migrations and credentials from live configuration; never print secrets. The last inspected Vercel CLI was 65.3.1; upgrade before provisioning.
4. Build a thin path: idempotent import into Neon, validation, reviewable changes, explicit publication and deterministic snapshot export. Pin deployment to a publication version. A failed import or unapproved batch must not alter the published snapshot. Export enough provenance to audit and reproduce it.
5. Keep the snapshot behind `lib/data.ts` or a small adjacent reader boundary. Audit federal refresh, FEC, Congress.gov, photos and platform jobs before widening shared office types. `lib/endorsements.ts` imports `Office` for the separate 2028 congressional file; preserve its federal scope. Migrate existing JSON writers explicitly when their canonical data moves to Neon.
6. Integrate state sections, office filters, search and profiles using real sourced records in development. Update contact/campaign links, news context, counts and methodology. Keep incomplete coverage off the public release.
7. Reconcile discovered endorsements against official service/election records and the saved gap registers. Meet the plan's nationwide launch checks before publishing the new roster. Do not interpret this handoff as permission to waive those checks.

## Acceptance and delivery

- Test import idempotency, invalid references, issuer attribution, term transitions, seat identity, federal-job exclusions and deterministic publication. Verify that pending edits cannot leak into a published version and that a previous publication can be restored.
- Run `npm test`, `npm run lint` and `npm run build`. Check mobile layout, keyboard navigation, search, filters, counts and real 404 responses. A prior local lint run encountered generated files in a nested `.claude` worktree; distinguish that environment issue from project-source failures.
- Keep infrastructure, behavior changes and roster population reviewable in small steps. No ORM has been selected. Avoid a general scraping framework or an admin UI unless required.
- Report remaining source blockers and actual verification results. Opening or merging the earlier Bernie badge PR does not authorize pushing, opening or merging this feature's PRs.
