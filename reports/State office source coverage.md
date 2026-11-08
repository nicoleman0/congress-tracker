# Source audit exposes nationwide roster gaps

Checked 8 November 2026. **Usable state-office endorsement sources exist nationwide, but a complete qualifying roster is not established.** Run for Something supplies historical legislative sources across all 50 states. Other groups add governor and legislative sources, with chapter, archive and access gaps. No state has completed current-term eligibility, election-outcome and service reconciliation. Finish those checks before publishing the expanded roster. Neon is a reasonable proposed home for the relational data and review workflow; JSON file size has not been demonstrated to be a limit.

## Coverage means sources, not eligible officials

The [combined matrix](state-office-source-coverage.tsv) contains **300 unique state/group records**, covering all 50 states and six approved groups. It records inspected sources, election years and gaps. This was a bounded nationwide source audit, not an exhaustive review of every chapter website or a verified politician roster.

| Group | States with a retrieved in-scope source | Main limit |
| --- | ---: | --- |
| Run for Something | 50 | Cumulative 2020–2026 sources; current terms and completeness unreconciled |
| Working Families Party | 22 | Expanded national list available; chapter and historical gaps |
| Our Revolution | 18 | Individual slates available; current chapter census missing |
| DSA | 5 | National tables and chapter-directory extraction blocked |
| Sunrise | 1 | Hub directory available; most hub endorsements not inspected |
| PCCC | 0 established | Historical champions lists exist, but endorsement meaning unconfirmed |

These counts come from the saved source observations and retrieval methods. A positive row means a retrieved primary source names an in-scope endorsement. It does not establish that the endorsee won, still serves, or qualifies for their current term. “Not established” means this pass did not verify a source. “Blocked” identifies an attempted retrieval or shared extraction dependency. WFP's nine inspected state sections without in-scope entries are page-limited findings, not claims that those states have no qualifying officials. No pair is marked not applicable. [WFP/Our Revolution notes](../research_notes/State%20office%20source%20coverage/wfp_or.md), [DSA/Sunrise notes](../research_notes/State%20office%20source%20coverage/dsa_sunrise.md), [RFS/PCCC notes](../research_notes/State%20office%20source%20coverage/rfs_pccc.md).

## National directories require reconciliation

**Run for Something is the strongest collection starting point.** Its inspected year directories for 2020–2026 contain legislative entries across all 50 states cumulatively. The 2022–2026 union covers 49; New Jersey appears in the inspected 2021 page. An old source cannot qualify a later term. Separate odd-year directories are accessible. The 2026 page contains 528 all-office cards, including 276 classified as legislative from office labels. Its October release reports 535 endorsements across local and state offices. That difference compares source representations, not seven known missing eligible legislators. Individual profiles and dated releases must be reconciled before import. ([Year directories](https://directory.runforsomething.net/candidates/), [October release](https://runforsomething.net/rfs-press/october-endorsements/))

RFS's inspected current and 2024 policies exclude statewide offices. Neither RFS nor PCCC yielded a verified governor endorsement in this pass. That is a research limit, not proof of historical absence. ([Current RFS criteria](https://runforsomething.net/run/candidate-endorsement-process/), [2024 criteria](https://runforsomething.net/run/candidate-endorsement-process-outreach/))

WFP's initial national HTML contained 232 rows. Following all **17 “View More” requests** returned 927 more, totaling 1,159 rows including DC and out-of-scope offices. Office-label filtering found 493 governor/legislative rows. Those are source rows, not unique eligible officials. The national page links 18 state organizations, which is a different count from pagination requests. Historical sources were retrieved for New York in 2022/2024 and Connecticut's 2022 governor election, but historical coverage remains incomplete. ([National page](https://workingfamilies.org/candidates/), [site pagination code](https://workingfamilies.org/wp-content/themes/ms-starter/assets/js/ajax.js?ver=1.0.1), [CT 2022](https://workingfamilies.org/2022/08/connecticut-working-families-party-endorses-ned-lamont-and-susan-bysiewicz-for-re-election/))

Our Revolution's retrieved index exposed 119 post links. Selected current and historical slates establish source availability in 18 states. Its accessible historical category covers 2024–2025; it cannot establish earlier governor endorsements. The former groups-directory URL returned 404. WFP and Our Revolution together provide source evidence in 28 states, without closing any state's chapter or term gaps. ([Current index](https://ourrevolution.com/our-champions/), [historical category](https://ourrevolution.com/category/past-endorsement/), [2024 Missouri slate](https://ourrevolution.com/missouri-endorsements-2024/))

## Chapter evidence and archive labels remain blockers

DSA's current endorsements, past endorsements and chapter directory embed Airtable tables. The audit retrieved shells rather than rows. Its tracker and election-map direct requests returned 403. Separate primary articles and chapter releases provide sources for GA, KY, MD, NY and OR. **The other 45 matrix rows share a national extraction blocker; they are not 45 individually failed chapter-site checks.** Obtain the public exports or inspect the tables in a browser before claiming a chapter inventory. ([Current](https://electoral.dsausa.org/our-campaigns/), [past](https://electoral.dsausa.org/our-campaigns/past-endorsements/), [chapters](https://www.dsausa.org/chapters/))

Sunrise's official map exposes a public directory with **111 records: 107 across 33 states and four in DC**. Those are directory records, not independently confirmed active or endorsing hubs. NYC provides readable 2026 Assembly/Senate endorsements. Chicago's historical lists require image extraction; sampled Seattle and Orange County retrievals failed. Most hubs have not been individually audited. The saved inventory excludes contact and leader data. ([Official hub page](https://www.sunrisemovement.org/hubs/), [map data](https://storage.googleapis.com/hub-data/hubs.json), [NYC endorsements](https://sunrisenyc.org/endorsements), [Chicago](https://www.sunrisemovementchicago.org/endorsements))

PCCC's inspected 2020–2023 champions archives contain legislative leads across 40 states, but do not explicitly call those listings endorsements. Source conflicts include a placeholder candidate and mismatched office/district labels. Its inspected 2024 and 2026 endorsement pages contain no in-scope office. Resolve the champions-to-endorsements meaning and locate later state-office sources before qualifying these leads. ([Archive index](https://www.boldprogressives.org/candidates/), [2022 champions](https://www.boldprogressives.org/2022-champions/), [2026 endorsements](https://www.boldprogressives.org/candidates/our-endorsements-2026/))

## Neon fits the relationships and publication workflow

**Recommendation, not an adopted decision:** use managed PostgreSQL on Neon as the canonical editable store, then generate a versioned, read-only publication snapshot for the site. Model people, offices/seats, terms, elections, endorsers/chapters, endorsements, sources and import batches separately. The audit demonstrates their different lifetimes and review needs; it does not demonstrate a JSON capacity problem.

Proposed flow: import batch → validation and reviewable diff → approved immutable publication version → deterministic export → deployment pinned to that version. JSON becomes a generated artifact, not a second editable source of truth. Existing automated jobs that write and auto-merge JSON must be migrated explicitly. Direct database reads are an alternative if immediate publishing or interactive queries justify runtime availability and cache work. No ORM or SDK choice is needed yet. [Database assessment](../research_notes/State%20office%20source%20coverage/database.md).

Neon provides isolated branches and standard PostgreSQL export. Plan preview isolation, least-privilege roles and tested recovery. Pooled connections suit concurrent web workloads; direct connections suit migrations and exports. Choose region, retention and plan after measuring the workload; no cost estimate is established. Before future provisioning, upgrade the installed Vercel CLI 65.3.1 with `npm i -g vercel@latest`. Nothing was provisioned or migrated. ([Branching](https://neon.com/docs/introduction/branching), [pooling](https://neon.com/docs/connect/connection-pooling), [export](https://neon.com/docs/guides/export-neon-postgres-compatible))

## Next work closes the launch gaps

1. Resolve the plan's proposed policies for incoming officials, primary endorsements, withdrawals and appointments.
2. Complete the official chapter census, extract DSA tables and image lists, and resolve PCCC's endorsement semantics.
3. Establish current officeholders and winning elections from official state sources. Use those elections to bound historical research, then reconcile 2026 candidates, results and term transitions separately.
4. Reconcile every discovered endorsement to an included person or documented exclusion. Track inaccessible sources as open gaps, never as zero qualifying people.
5. Agree the storage/publication decision and maintenance process before implementation. No application code changed; no complete roster count, delivery estimate or launch date is established.
