# RFS and PCCC endorsement gap review

## What changed since the first audit?

### Takeaway

The New Jersey historical gap was an extraction error, not a missing source. A broken June release link was repaired through a second official URL. PCCC historical governor endorsement scope is now verified, while its champions-list meaning remains unresolved.

### Cited findings

- Source checks were performed on 8 November 2026. The reconciliation snapshot records 19:40 UTC; individual profile checks have their own UTC timestamps. `rfs_pccc_source_ledger.tsv` records 42 sources and access limitations. Earlier audit files were preserved.
- The first classifier did not recognize General Assembly. On the same newly retrieved 2025 directory HTML, the old rule counts 21 legislative cards in eight states and the corrected rule counts 24 in nine. Exactly three additions are Katie Brennan, Brandon Saffold and Balvir Singh in New Jersey. All seven 2020–2026 all-office card totals match the earlier snapshot, so this change is attributable to classification rather than an observed directory update. [2025 directory](https://directory.runforsomething.net/candidates/2025/)
- Each of those three profiles explicitly says 2025 Endorsement. An October 17, 2025 RFS release independently states that it endorsed Brennan for General Assembly District 32. [Brennan profile](https://directory.runforsomething.net/candidate/8142f3bae18b7d99f4917a09e3899eac/brennan-katie/), [official release](https://runforsomething.net/rfs-press/young-nj-candidates-driving-voter-enthusiasm/)
- Corrected RFS legislative-source coverage is all 50 states across the inspected 2022–2026 pages, rather than the first audit's 49. This remains source availability, not current-term eligibility. [Directory and year links](https://directory.runforsomething.net/candidates/)
- The official press index's June endorsement link points to `/june2026-endorsements/`, whose displayed content is a June 26 CampSight announcement. The actual June 2 endorsement announcement is available at a different official URL and contains 32 named slate entries. The ledger retains both URLs. [Wrong-content destination](https://runforsomething.net/rfs-press/june2026-endorsements/), [June 2 slate](https://runforsomething.net/rfs-press/https-runforsomething-net-rfs-press-june2026-endorsements/)
- PCCC has retrieved issuer pages explicitly headed “Our Endorsements: 2016” and “Our Endorsements: 2018.” The former lists Colin Van Ostern for New Hampshire governor. The latter lists governor candidates in Arizona, Florida, Georgia, Iowa, Michigan and New York. These establish historical endorsement scope only. [2016](https://www.boldprogressives.org/candidates/2016/), [2018](https://www.boldprogressives.org/candidates/2018/)

### Inferences

- The corrected office classifier must recognize General Assembly, state-name-prefixed Assembly/House/Senate, Delegate(s) and unicameral Legislature labels. The research script includes regression assertions for General Assembly, Nebraska Legislature and House of Delegates, plus a negative check for County Legislature.
- The new 100-row coverage table has 50 RFS states with verified historical legislative sources, eight PCCC states with verified gubernatorial endorsement sources, and 42 PCCC states without verified endorsement evidence in this audit. Seven positive PCCC rows concern 2016/2018 only; the eighth is New Jersey in 2025, confirmed by independent primary reporting as described in `rfs_pccc_evidence_followup.md`. None is current-term complete.

### Gaps

- Candidate-level term, current-service and election-result verification was not performed. Earlier endorsements cannot be carried into later terms.
- RFS 2021 and 2023 directories were retrieved, but corresponding release archives were not exhaustively reconstructed. The 2025 press-index release set was enumerated; one May 2025 mixed-format slate yields only 22 parseable named rows against its advertised 51, so that batch is not treated as reconciled.

## How far does the RFS 535 versus 528 reconciliation go?

### Takeaway

The discrepancy is now a named-record comparison rather than a subtraction of headlines. All directory records can be associated with collected release evidence only if five proposed name matches are accepted, but those matches remain separate review items. Six other release-listed candidacies have no matching 2026 directory card. The total of 535 is still unresolved.

### Cited findings

- The October 6 release reports 535 endorsements for 2026 across all local and state offices. The retrieved 2026 directory has 528 cards with 528 unique profile URLs and 276 displayed legislative office labels. These are not counts of eligible officials. [October release](https://runforsomething.net/rfs-press/october-endorsements/), [2026 directory](https://directory.runforsomething.net/candidates/2026/)
- Ten 2026-cycle slates were compared: December 18, 2025, then February through October 2026, using the corrected June 2 URL. They contain 525 named rows and 523 unique normalized name/state keys. Normalization removes punctuation, accents and leading honorifics, but does not merge people with different names. Arriell Gipson-Martin and Emily Gregory appear in two slates each. Every source row is retained in `rfs_pccc_release_rows.tsv`; individual matches are in `rfs_pccc_release_directory_comparison.tsv`. [Press index](https://runforsomething.net/rfs-press/), [December slate](https://runforsomething.net/rfs-press/run-for-something-endorses-56-young-candidates-across-19-states-supporting-the-next-generation-of-leaders/)
- Of those 523 keys, 512 exactly match a 2026 directory name/state key. Eleven do not. Of the directory's remaining 16 keys, eleven are exact matches in the August/September 2025 releases. Their individual profiles explicitly label the endorsement 2026, so announcement date and endorsement year must be stored separately. [August 2025](https://runforsomething.net/rfs-press/august-endorsements/), [September 2025](https://runforsomething.net/rfs-press/rfs-endorses-81-young-candidates-across-23-states/)
- The five remaining directory names form proposed same-seat matches: Aysha Pamukcu/Aysha Dominguez Pamukcu; Mallory Craig/Mallory Craig-Karim; Hannah Sabio/Hannah Sabio-Howell; Emilia Cortez-Sharkey/Emilia Cortez; Neil Manimaal/Neil Manimala. Retrieved profiles establish the directory names, office labels and 2026 year, but matching a seat alone does not establish identity. They are not merged. [Profile example](https://directory.runforsomething.net/candidate/627b8ea14ab029f1c108070c5627f12b/cortez-emilia/)
- The six remaining release-listed candidacies are Matthew Crowley, Kell Cameron, Davon Magwood, Torrey Harris, Kofi Osei and Cat Sharp. They include local offices as well as legislative offices. Dates, exact office wording and older profiles are preserved in `rfs_pccc_release_only_review.tsv`. [May slate](https://runforsomething.net/rfs-press/may2026-endorsements/), [April slate](https://runforsomething.net/rfs-press/april-endorsements2026/), [February slate](https://runforsomething.net/rfs-press/feb2026-endorsements/), [December slate](https://runforsomething.net/rfs-press/run-for-something-endorses-56-young-candidates-across-19-states-supporting-the-next-generation-of-leaders/)
- Crowley's older profile is a 2025 local commissioner endorsement; Harris's is a 2022 endorsement with displayed district 90, while the April 2026 release names district 91; Osei's is a 2023 township-supervisor endorsement. These profiles cannot substitute for the later legislative endorsement events. No matching inspected directory record was found for Kell Cameron, Davon Magwood or Cat Sharp. Absence is not evidence of withdrawal. [Crowley](https://directory.runforsomething.net/candidate/d6d59ac0b31494a47b65988ce5ee61fd/crowley-matthew/), [Harris](https://directory.runforsomething.net/candidate/2814/harris-torrey/), [Osei](https://directory.runforsomething.net/candidate/3719/osei-kofi/)
- Cumulative claims do not add consistently to each advertised batch: July reports 408, August adds 44 but reports 451, September adds 37 but reports 489, and October adds 48 but reports 535. The displayed sources do not explain the changes. [July](https://runforsomething.net/rfs-press/run-for-something-endorses-nearly-50-young-candidates-across-24-states/), [August](https://runforsomething.net/rfs-press/august_2026_endorsements/), [September](https://runforsomething.net/rfs-press/run-for-something-endorses-37-young-candidates-across-21-states/), [October](https://runforsomething.net/rfs-press/october-endorsements/)

### Inferences

- The comparison accounts for 523 directory keys exactly across all collected releases, leaving five proposed aliases. This does not establish 528 independently verified endorsement identities.
- If the five proposed aliases are confirmed, the directory plus six remaining release candidacies would represent 534 distinct discovery identities under this comparison. That still does not explain the headline 535. It is not a roster count.
- Source totals may reflect updates, duplicate events, removals or changed candidacies. None of those explanations is established globally, so the records and discrepancy must remain explicit.

### Gaps

- Confirm the five name variants against official filings or a primary identity cross-reference. Resolve the six release-only candidacies using dated candidacy or endorsement-change evidence.
- Account for any earlier cohort or correction needed to explain 535. Do not infer seven missing legislators from 535 minus 528.
- Profiles checked here cover 24 distinct selected URLs, not all 528 directory profiles. The separate check table records their endorsement years and retrieval status.

## Which PCCC and organizational gaps remain?

### Takeaway

There is still no verified blanket equivalence between PCCC's 2020–2023 champions lists and endorsements. More individual evidence exists, but it cannot be used to silently relax the source rule.

### Cited findings

- PCCC's own services page distinguishes “endorsements and other direct support,” describes training separately, and requires a questionnaire as a first step toward endorsement. It does not define the historical champions lists as endorsed candidates. [Official services](https://www.boldprogressives.org/resources-for-candidates/)
- A February 12, 2024 campaign-hosted announcement says PCCC endorses Alex Mohajer for California Senate District 37 and attributes a statement to PCCC Candidate Services Director Hannah Riddle. Christine Clarke's campaign also attributes a PCCC statement to Riddle. These are stronger than bare logos, but neither is an issuer-hosted archive or a definition of all champions entries. Both remain corroborating leads pending independent corroboration of the particular statement. [Mohajer announcement](https://alexmohajer.com/progressive-change-campaign-committee-endorses-alex-mohajer-for-california-state-senate-district-37/), [Clarke endorsements](https://www.christineclarkenj.com/endorsements)
- A republished PCCC release dated February 12, 2024 publicly states it is endorsing a state/local union slate in Alaska, California, Florida, Texas and Wisconsin. Its named slate is behind a subscriber wall. The accessible excerpt proves a slate existed, but cannot qualify particular people or identify which states had legislative rather than local offices. No login was attempted. [Public release excerpt](https://www.wispolitics.com/2024/pccc-endorses-slate-of-union-members-running-in-state-and-local-races/)
- The official 2024 and 2026 endorsement pages still do not provide the missing state-office coverage. The historical 2020–2023 champions pages remain usable discovery leads with unresolved endorsement semantics. [2024](https://www.boldprogressives.org/candidates/our-endorsements-2024/), [2026](https://www.boldprogressives.org/candidates/our-endorsements-2026/), [2023 champions](https://www.boldprogressives.org/2023-champions/)
- RFS explicitly distinguishes its PAC, Action Fund and Civics entities. These are national network entities, not proof of official state endorsing chapters. PCCC's services and training programme likewise does not establish a chapter network. Partners, regional staff and trainees are not automatically qualifying endorsers. [RFS network description](https://runforsomething.net/rfs-press/https-runforsomething-net-rfs-press-june2026-endorsements/), [PCCC programme](https://www.boldprogressives.org/resources-for-candidates/)

### Inferences

- Verification does not require issuer-domain hosting. Independent primary reporting, especially a direct statement from an identified organization spokesperson, can verify an endorsement. The original wording here imposed an issuer-domain-only restriction that the user had not approved; that restriction is corrected. Preserve originating source, reproducing host and strength of corroboration separately.
- Closing PCCC needs either an explicit issuer statement defining each champions archive or individual dated endorsements supported by issuer statements or reliable primary reporting, followed by recovery of its later state-office lists.

### Gaps

- A Wayback public-index request for the missing 2024 archive failed in the web tool and by direct TLS access-denied. No capture date or archived page was recovered. Blue Voter Guide's PCCC California 2024 page failed with web cache-miss/direct HTTP 403; search snippets were not promoted to evidence.
- The official PCCC 2016/2018 endorsement URLs were recovered from actual links after guessed slugs returned 404. The 2016 governor PDF lead was not readable in the web tool and was not needed once the official HTML page was found.
- Direct RFS HTTPS initially returned 403 without a browser user-agent, then succeeded with a normal public user-agent. One later SSL EOF was recovered by a bounded retry and recorded in the reconciliation summary. No authenticated or private API was used.
- No organization was contacted. No application, database or deployment changes were made. The gap register preserves the remaining checks; current-term nationwide completeness is not established.
