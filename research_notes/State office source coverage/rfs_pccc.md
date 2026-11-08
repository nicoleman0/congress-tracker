# Run for Something and PCCC source audit

## Which national and historical sources are usable?

### Takeaway

Run for Something has usable national year directories and explicit year-labelled endorsement profiles. PCCC has historical state/local candidate lists, but the inspected lists call people champions rather than explicitly confirming endorsement; that distinction needs resolution before qualification.

### Cited Findings

- Audit date: 8 November 2026. The attached aggregate JSON records direct HTTPS retrieval timestamps, including 19:00 UTC for the year directories. Public pages were inspected with web retrieval and direct Python HTTPS/HTML parsing. No application files were changed.
- RFS's own main site links to the candidate directory as endorsed candidates, establishing the directory's affiliation. The directory root returned no readable web-tool content, but `/candidates/` and year pages returned HTML with candidate cards. This is a recoverable entry-point issue, not a blocked directory. [RFS endorsement criteria](https://runforsomething.net/run/candidate-endorsement-process/), [directory](https://directory.runforsomething.net/candidates/)
- Seven retrieved RFS year pages cover 2020 through 2026. They render candidate name, office, district/state, biography, profile and campaign links. Year-specific pages exist separately, including odd-year elections. [2020](https://directory.runforsomething.net/candidates/2020/), [2021](https://directory.runforsomething.net/candidates/2021/), [2022](https://directory.runforsomething.net/candidates/2022/), [2023](https://directory.runforsomething.net/candidates/2023/), [2024](https://directory.runforsomething.net/candidates/2024/), [2025](https://directory.runforsomething.net/candidates/2025/), [2026](https://directory.runforsomething.net/candidates/2026/)
- Two inspected individual profiles explicitly give an endorsement year: Eduardo Guzman has a 2026 endorsement for Arkansas state Senate District 27; Saira Draper has a 2024 endorsement for Georgia state House District 90. These establish endorsement-source format, not service or election outcome. [Guzman profile](https://directory.runforsomething.net/candidate/be7f4c1cdcbc56644d9b8d728682d0c6/guzman-eduardo/), [Draper profile](https://directory.runforsomething.net/candidate/3650/draper-saira/)
- Both the current RFS application criteria and a still-accessible 2024 criteria page exclude statewide elections. Governor endorsements are outside those inspected policies. The current page has advanced to 2027, so it cannot replace evidence about earlier cycles. [Current criteria](https://runforsomething.net/run/candidate-endorsement-process/), [2024 criteria](https://runforsomething.net/run/candidate-endorsement-process-outreach/)
- PCCC's candidate page links historical state/local champions pages for 2017–2023 and separate endorsement pages for other cycles. This audit retrieved all four 2020–2023 champions pages. Their HTML contains legislative office and district entries, but no occurrence of the word endorse. [Candidate index](https://www.boldprogressives.org/candidates/), [2020](https://www.boldprogressives.org/2020-champions/), [2021](https://www.boldprogressives.org/2021-champions/), [2022](https://www.boldprogressives.org/2022-champions/), [2023](https://www.boldprogressives.org/2023-champions/)
- PCCC's inspected 2026 endorsement page lists federal offices and Colorado secretary of state, with no governor or state legislative entry. Its linked 2024 page contains one US House candidate. These are findings about the inspected pages, not proof that PCCC made no state-office endorsements in those years. [2026](https://www.boldprogressives.org/candidates/our-endorsements-2026/), [2024](https://www.boldprogressives.org/candidates/our-endorsements-2024/)

### Inferences

- RFS is suitable as a major nationwide source for a candidate discovery pass. Direct profiles should be used as qualification evidence during roster reconciliation.
- PCCC historical champions may be endorsements, but that equivalence was not established by the inspected source wording. Treat those names as leads until corroborated by a PCCC endorsement announcement or an explicit explanation of the list.
- A central RFS collection appears more useful than a chapter audit for this organization. No official endorsing chapter network was established in the inspected navigation and criteria. That is not proof no such structure exists. PCCC has the same unestablished chapter-network status.

### Gaps

- No accessible, explicitly documented bulk export/API was found in the inspected page links. Server-rendered HTML is usable; there is no need to depend on a private API for source discovery.
- Guessed PCCC `/2024-champions/`, `/2025-champions/` and `/2026-champions/` URLs failed via web retrieval. They were not linked from the inspected candidate index. These failed guesses do not establish that no historical sources exist elsewhere.
- PCCC governor endorsements and 2024–2026 state/local source completeness remain unestablished. No positive governor endorsement source for these two organizations was verified in this bounded audit.
- Sources before 2020 were not audited beyond observing archive links. No assumption is made that all current terms began after that cutoff.

## What state and election-year coverage is established?

### Takeaway

RFS legislative endorsement-source pages are available for all 50 states cumulatively across 2020–2026, but recent-cycle and current-term completeness are separate questions. PCCC's historical champions lists provide leads across 40 states in 2020–2023; their endorsement meaning and later coverage remain open.

### Cited Findings

The following counts come from direct HTML inspection, reproduced by `rfs_pccc_audit_sources.py` and saved in `rfs_pccc_source_counts.json`. Legislative cards were classified from displayed office labels, including older state-name prefixes such as Florida House. Counts are page cards, not unique people, winners, current officials or final eligible entries.

| Organization and year | All-office cards | Legislative cards | States with legislative cards | Source |
| --- | ---: | ---: | ---: | --- |
| RFS 2020 | 660 | 409 | 46 | [2020 directory](https://directory.runforsomething.net/candidates/2020/) |
| RFS 2021 | 407 | 17 | 6 | [2021 directory](https://directory.runforsomething.net/candidates/2021/) |
| RFS 2022 | 627 | 331 | 43 | [2022 directory](https://directory.runforsomething.net/candidates/2022/) |
| RFS 2023 | 422 | 33 | 4 | [2023 directory](https://directory.runforsomething.net/candidates/2023/) |
| RFS 2024 | 604 | 276 | 41 | [2024 directory](https://directory.runforsomething.net/candidates/2024/) |
| RFS 2025 | 287 | 21 | 8 | [2025 directory](https://directory.runforsomething.net/candidates/2025/) |
| RFS 2026 | 528 | 276 | 42 | [2026 directory](https://directory.runforsomething.net/candidates/2026/) |
| PCCC 2020 champions | Not counted | 97 | 30 | [2020 list](https://www.boldprogressives.org/2020-champions/) |
| PCCC 2021 champions | Not counted | 23 | 2 | [2021 list](https://www.boldprogressives.org/2021-champions/) |
| PCCC 2022 champions | Not counted | 75 | 23 | [2022 list](https://www.boldprogressives.org/2022-champions/) |
| PCCC 2023 champions | Not counted | 37 | 5 | [2023 list](https://www.boldprogressives.org/2023-champions/) |

- Odd-year RFS source states: 2021 has CA, MS, NJ, OK, RI, VA; 2023 has LA, MS, TN, VA; 2025 has AL, FL, GA, MN, OK, TX, VA, WA. These include special-election candidates and are not a statement about which states hold regular elections in a year. [2021](https://directory.runforsomething.net/candidates/2021/), [2023](https://directory.runforsomething.net/candidates/2023/), [2025](https://directory.runforsomething.net/candidates/2025/)
- The RFS 2022–2026 directory union yields legislative cards for 49 states. NJ is present in the inspected 2021 page but not established in those later year pages. The 2024–2026 union yields 45 states; the full 2020–2026 union yields all 50. This is source-page availability, not current-term qualification. [RFS directory and linked years](https://directory.runforsomething.net/candidates/)
- The PCCC 2022–2023 champions union yields legislative candidate leads in 28 states. The full 2020–2023 union yields 40 states. [2020](https://www.boldprogressives.org/2020-champions/), [2021](https://www.boldprogressives.org/2021-champions/), [2022](https://www.boldprogressives.org/2022-champions/), [2023](https://www.boldprogressives.org/2023-champions/)

### Inferences

- The required 100-row state/organization matrix is `rfs_pccc_coverage.tsv`: 50 RFS rows are `verified_in_scope_source`, because at least one inspected historical legislative endorsement directory supports each state. All 50 PCCC rows are `not_established`, because champions-list endorsement semantics are unresolved. The PCCC rows still preserve state-specific historical lead URLs and years.
- No matrix row means a state's current roster is complete. In particular, a state with only old source evidence still needs a current-term audit. Other organizations' sources may qualify people absent from RFS.
- These two groups do not independently establish nationwide coverage of governors.

### Gaps

- The extraction has not been checked against every individual profile. Displayed office labels, districts, years and links need candidate-level validation before import.
- No election result, inauguration date, continued service, endorsement withdrawal or office move was verified for the extracted card population.
- The year pages mix local and state offices and may preserve superseded candidacies. Profile/card identity and election events must be reconciled rather than deduplicated only on name.

## What prevents a complete nationwide roster claim?

### Takeaway

RFS is accessible but its directory and dated releases need reconciliation. PCCC has unresolved endorsement semantics, later-cycle gaps and source-quality defects. Neither group's source availability is a substitute for official service and election evidence.

### Cited Findings

- RFS's October 6, 2026 release says its final class brings the cycle to 535 endorsed candidates across 48 states, covering local and state offices. At 19:00 UTC on 8 November, direct inspection of the 2026 directory found 528 candidate card elements covering all offices. The apparent seven-card difference compares different source representations; it does not prove seven eligible state legislators are missing. [Final release](https://runforsomething.net/rfs-press/october-endorsements/), [2026 directory](https://directory.runforsomething.net/candidates/2026/)
- The February 17, 2026 RFS announcement provides a dated slate with explicit offices. Such releases provide a second source against which directory entries can be reconciled; they are individual batches rather than a complete cycle inventory. [February slate](https://runforsomething.net/rfs-press/feb2026-endorsements/)
- PCCC's 2022 list includes a Connecticut State House entry named An Amazing Candidate, without a district in its displayed location. It also labels a Robert Zeigler entry State Senate while its district string is PA-HD-171. Those source conflicts require manual review. [2022 champions](https://www.boldprogressives.org/2022-champions/)
- PCCC's 2023 list contains a Victor McKenzie entry labelled State Senate with district VA-SD-82. No correction is inferred here; the displayed fields need comparison with official race records. [2023 champions](https://www.boldprogressives.org/2023-champions/)

### Inferences

1. Reconcile RFS's yearly directory against all dated endorsement releases for relevant cycles, preserving profile URLs and endorsement years. Explain any count differences before treating a directory as exhaustive.
2. For PCCC, locate a primary statement connecting champions to endorsements, then establish missing 2024–2026 state-office archives or batch announcements. Keep training participation and candidate services out of the qualifying evidence.
3. Match discovered people to official election and legislative/governor sources to establish current terms, outcomes and transitions. An old endorsement alone cannot qualify a later term.
4. Keep explicit unresolved records rather than converting no retrieved source into no qualifying official.

### Gaps

- No contacts were sent to either organization. A request for a complete historical endorsement export could resolve archive and completeness gaps, but was not authorized or performed.
- Chapter networks were not established for either organization; no fabricated chapter inventory was created.
- This bounded audit establishes usable sources and exact limitations. It does not establish a final roster count, national completeness or implementation readiness.
