# State roster: handoff

Branch `state-roster-research`, not pushed. Rules: [state-offices.md](state-offices.md). Research brief: [state-roster-research.md](state-roster-research.md).

## Done

- Per-state research, verified and committed (unreviewed): DE, ME, NM, NE, VA, CO. NY and CT were written; check `git log` for whether they were verified and committed. CA, PA, MI and GA agents were launched; check `research_notes/roster/` for their files.
- Saved national evidence: Open States rosters (`research_notes/openstates/`, `scripts/openstates.ts`), WFP 2026 full list (`research_notes/national/wfp-2026-candidates.tsv`, `scripts/wfp-candidates.ts`), DSA tables and RFS cards (under `research_notes/State endorsement gap review/`).
- `scripts/match-national.ts` matches those lists to seated legislators. Output: `research_notes/national/matches.tsv` (577 seated matches; 25 Massachusetts and New Hampshire district names unmatched).
- `scripts/verify-roster.ts` checks a research file's shape and every excerpt.

## Agreed to cut cost

Per-state agents cost 150k–300k tokens each. Don't launch more full-state agents. Instead:

1. Use `matches.tsv` for serving legislators: a seated match is proof of the win. Whether the endorsement covers the current term is a review step (the term's election year must match the endorsement's).
2. Send agents only for gaps the national lists miss: state and chapter pages, WFP 2022 and 2024, Our Revolution, PCCC, Sunrise, governors, and results for incoming winners. Use Haiku for mechanical tasks. Require reports of five lines or fewer.

## Next

Decided 2026-11-09: ship with dated coverage gaps. The gate accepts `blocked` and `in_progress` cells; state pages list them. States without research get `in_progress`.

1. Build the batch: `tsx scripts/roster-import.ts OUT research_notes/roster/*.json`, then `import`, `review`, `check`, `publish --confirm-gaps`, `export` (see `db/state-offices/README.md`).
2. Recheck 2026 results once certified; many entries are `pending` or `unknown` and are excluded until then.
3. Not yet used: `matches.tsv` for the 38 unresearched states. Its 2026 WFP matches are sitting incumbents, so they need 2026 results before they qualify.

Untracked `scripts/outside-money.ts` is not part of this work and breaks `tsc` (missing `lib/money.ts`).
