# Governors and state legislators

Planning draft, 8 November 2026. Eligibility and nationwide launch scope are agreed. Implementation has not started.

## Agreed scope

- Cover governors and state legislators across all 50 states.
- Launch with all qualifying officials nationwide, rather than a pilot roster.
- Accept endorsements from Working Families Party, Our Revolution, Democratic Socialists of America, Run for Something, Progressive Change Campaign Committee and Sunrise Movement.
- Accept verified endorsements by those organizations' official state and local chapters. Attribute the endorsement to the chapter that issued it.
- For sitting officials, accept an endorsement from the election that won their current term, including elections before 2026.
- State-only organizations need a separate agreed list before they can qualify anyone.
- Keep the existing congressional eligibility rules. The broader list applies to the new state-office roster.

## Listing rules

Agreed with the user on 8 November 2026.

- Show qualifying sitting officials and qualifying 2026 winners awaiting inauguration, labelled incoming. Uncalled races are not shown; a winner appears once the race is called.
- Track the office currently held separately from the office won. An incoming official must not replace the current officeholder before the term starts.
- A prior endorsement qualifies the term won in that election. It does not carry into a later term without qualifying evidence for that later election.
- A primary endorsement in the same election cycle can qualify a general-election winner. Record the election stage and any subsequent withdrawal of support.
- Do not treat party affiliation, organization membership, training, donations or a candidate's unsupported endorsement claim as an endorsement.
- Retain withdrawn endorsements as evidence, but do not use them to qualify a listing. Another valid endorsement can still qualify it.
- A legislator on the official current roster for the endorsed seat (Open States, which links each member's official page) counts as having won it; no separate result source is needed. Incoming winners still need a results source. Agreed 9 November 2026.
- Appointees without a qualifying endorsement for the election that won their current term are excluded.
- Mayors, DC Council, lieutenant governors, other statewide offices and territorial offices are outside this release.

## Source audit before implementation

Create an inventory of each approved national organization and its official endorsing chapters. For each state and organization, record the applicable sources, election years, review date and coverage status. A national page is not assumed to contain all chapter endorsements.

Start from these primary sources:

| Organization | Starting source |
| --- | --- |
| Working Families Party | https://workingfamilies.org/candidates/ |
| Our Revolution | https://ourrevolution.com/our-champions/ |
| DSA | https://electoral.dsausa.org/our-campaigns/ |
| Run for Something | https://runforsomething.net/run/candidate-endorsement-process/ |
| PCCC | https://www.boldprogressives.org/candidates/our-endorsements-2026/ |
| Sunrise Movement | https://www.sunrisemovement.org/endorsements/ |

Run for Something's published criteria exclude statewide offices. Its endorsements can qualify legislators, not governors. Its current application page has advanced to 2027, so the audit must locate the relevant historical rosters.

For each discovered endorsement:

1. Verify the issuing organization's identity and, for a chapter, its affiliation.
2. Save the source URL, election year and stage, short supporting passage and check date. Capture a dated source snapshot where practical, subject to reuse rights.
3. Match the person to the state, chamber and seat. Send ambiguous identities to manual review.
4. Verify current service and term dates against official office or legislative sources. Verify election results against official election sources or an explicitly cited projection.
5. Record inclusion, exclusion or an unresolved question with a reason. Reconcile duplicates across endorsers.

An endorsement page's congratulations message is not sufficient evidence of an election result. Search engines and third-party lists can locate evidence but do not replace the primary endorsement source.

Audit output must distinguish reviewed with qualifying entries, reviewed with no qualifying entries, not applicable and blocked. A missing or inaccessible source is not evidence that no endorsement exists.

## Data and code changes

- Add explicit office types for governor and state legislative chambers. Preserve existing congressional IDs and URLs.
- Represent chamber names, district labels and seat identifiers without assuming numeric districts or one person per district. Support unicameral legislatures.
- Store each endorsement's issuer, parent organization where applicable, election, source and check date. Keep qualification evidence separate from election and current-service evidence.
- Separate current service, election outcome and term dates. Do not reuse the existing `incumbent` boolean to represent all three.
- Keep campaign links with provenance that does not require an FEC committee ID. Official contact links must remain distinct from campaign actions.
- Allow portraits with source and credit information independent of Congress.gov identifiers. Missing portraits do not block listing.
- Keep canonical state records in Neon PostgreSQL and expose reviewed generated snapshots through the roster module. A separate state JSON file is a publication artifact, not an authoring source. Share only fields and validation rules that have the same meaning.
- Add explicit federal-office guards before widening shared types. Audit refresh, campaign links, bill records, photos and platform checks.
- Preserve the separate 2028 congressional endorsement file and its validation. It imports the current shared `Office` type, so widening that type must not silently expand its scope.
- Use a repeatable import and validation command for roster collection. Do not build a general scraping framework before the audit establishes the source formats.

Relevant existing boundaries: `lib/data.ts`, `lib/endorsements.ts`, `scripts/refresh.ts`, `scripts/campaign-links.ts`, `scripts/record.ts`, `scripts/photos.ts` and `scripts/check-platform.ts`.

## User experience

- State pages separate Congress, governor and state legislature. Use the state's actual chamber names.
- The full roster supports office filtering. Search includes office and district context so state and federal seats cannot be confused.
- Profiles show why someone qualifies, who endorsed them, current service or incoming status, and sources with check dates.
- Contact and campaign actions match the office. News searches use state-office context.
- Homepage text, counts, metadata, FAQ and methodology describe the expanded scope. State legislators are not counted as members of Congress.
- Retain current congressional routes and real 404 responses for unknown IDs.
- Do not label a state as having no progressive officials merely because no one meets the published listing rule.
- Defer state voting-record ingestion, address lookup and automated platform collection. The first release requires identity, eligibility, office, status and usable contact or campaign links.

## Delivery sequence

1. **Finish the policy and source inventory.** Resolve the proposed listing rules. Establish the chapter inventory, historical sources and any blockers. Estimate roster collection from the audited sources.
2. **Data model and federal safeguards.** Add validation and import boundaries. Test invalid offices, provenance, dates, chapter attribution and district/seat identity. Confirm federal jobs cannot process state records.
3. **Thin end-to-end path.** Use real sourced examples to exercise governor, legislative chambers, multi-member districts and incoming officials in state pages, search and profiles. Keep this work off the public release until coverage is complete.
4. **Complete the nationwide roster.** Import, deduplicate and reconcile every audited source. Review earlier-election endorsements for officials not on the 2026 ballot.
5. **Release review.** Verify coverage, evidence, behavior, accessibility and maintenance procedures before opening the release PR.

Implementation can use several PRs, but intermediate merges must not publish an incomplete state roster. Choose the simplest release control after inspecting the hosting workflow.

## Launch checks

- Every state and approved endorsing organization has an audit outcome. Applicable chapter sources are accounted for. No unresolved source gap is presented as complete coverage.
- Every discovered in-scope endorsement is reconciled to a listed person or a documented exclusion. Every included person has evidence of eligibility and service or election status.
- Coverage is described as complete against the agreed sources and rules on a stated date, not as a claim to identify every progressive politician.
- Office labels, chamber names, seat identity and term transitions work for the roster's real edge cases. Multi-member districts do not trigger the congressional duplicate-seat rule.
- Search, filters, counts, profiles, contact links and 404s work across federal and state offices.
- Federal refresh, FEC, Congress.gov and portrait jobs still operate only on supported federal records.
- Uncalled state races are not shown, so they need no recheck cadence. Define how expiring terms and incoming handovers are refreshed before launch. Keep endorsement, result and service check dates separate.
- Tests, lint and production build pass. Check mobile layout and keyboard navigation.

## Planning limits

The [nationwide source audit](../../reports/State%20office%20source%20coverage.md) records 300 state/group combinations. The [gap review](../../reports/State%20endorsement%20gap%20review.md) improves source coverage, including historical legislative sources across all 50 states. National completeness is not established: chapter, historical and governor coverage remain incomplete. No state has completed current-term eligibility, election-outcome and service reconciliation. No qualifying roster count or delivery estimate has been verified.

## Adopted storage decision

The user approved Neon PostgreSQL as the canonical editable store, with reviewed versioned snapshots generated for the site. A separate state JSON file is a publication artifact rather than an authoring source. The audit found relational and import-review needs, not a demonstrated JSON size limit. No database has been provisioned or migration run. The [storage assessment](../../reports/State%20office%20source%20coverage.md#neon-fits-the-relationships-and-publication-workflow) records the architecture rationale; schema design and changes to existing JSON-writing jobs remain implementation work.
