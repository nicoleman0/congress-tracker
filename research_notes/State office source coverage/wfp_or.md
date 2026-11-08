# WFP and Our Revolution source coverage

## What national, chapter and historical sources are accessible?

### Takeaway
The national sites provide usable endorsement evidence, but neither establishes a complete current-term roster or complete official chapter inventory. Checked 8 November 2026. This is a source audit, not validation of election outcomes or current service.

### Cited Findings
- WFP's national page is titled 2026 and has state sections. The site's own JavaScript loads additional candidates through a read-only `more_candidates` request using the state ID and existing row count. I retrieved all 17 additional lists successfully. The initial HTML had 232 rows, with another 927 returned by the endpoint, totaling 1,159 rows including DC and out-of-scope offices. Office-label classification found 493 governor/legislative rows, across 22 states; these are raw source rows, not deduplicated, dated, currently eligible officials. [National page](https://workingfamilies.org/candidates/), [published retrieval code](https://workingfamilies.org/wp-content/themes/ms-starter/assets/js/ajax.js?ver=1.0.1).
- New York's WFP 2022 voting guide and 2024 legislative announcement remain available; Connecticut's 2022 gubernatorial endorsement is available. These establish that historical evidence exists, without verifying who is serving now. [NY 2022](https://workingfamilies.org/2022/10/nywfp-voting-guide-for-the-2022-midterm-election/), [NY 2024](https://workingfamilies.org/2024/03/new-york-working-families-party-endorses-100-candidates-for-new-york-state-senate-and-state-assembly/), [CT 2022](https://workingfamilies.org/2022/08/connecticut-working-families-party-endorses-ned-lamont-and-susan-bysiewicz-for-re-election/).
- A WFP Oregon announcement published in December 2025 discusses the upcoming legislative election and promises further endorsements. Publication year alone cannot establish election year or a final slate. [Oregon announcement](https://workingfamilies.org/2025/12/oregon-working-families-party-endorses-state-legislative-candidates/).
- Our Revolution's current index exposed 119 distinct post URLs in retrieved HTML. I retrieved 22 legislative source pages selected from that index, five further current legislative pages and historical pages. Its WordPress Past-Endorsement category metadata returned 27 records dated July 2024 through November 2025, including a Virginia House of Delegates endorsement. This is the accessible category's scope, not proof that older endorsements did not exist. [Current index](https://ourrevolution.com/our-champions/), [historical category](https://ourrevolution.com/category/past-endorsement/), [Virginia 2025](https://ourrevolution.com/joshua-cole-delegate-virginia-hd-65/).
- Retrieved Our Revolution historical pages establish legislative source availability for Massachusetts, Michigan, Missouri and Vermont in 2024. Missouri's page also contains a gubernatorial endorsement. No claim about any named candidate's result is made here. [MA](https://ourrevolution.com/massachusetts-endorsements-2024/), [MI](https://ourrevolution.com/michigan-endorsements-2024/), [MO](https://ourrevolution.com/missouri-endorsements-2024/), [VT](https://ourrevolution.com/vermont-endorsements-2024/).
- ORMA's own policy expressly permits affiliate endorsements and distinguishes local, state and national consideration. Its 2026 newsletter names state legislative endorsees. This demonstrates why the national list alone is insufficient, but national confirmation of every affiliate's current status was not established. [Policy](https://ourrevolutionma.com/orma-candidate-endorsement-policy/), [2026 newsletter](https://ourrevolutionma.com/2026-08-04-organizing-notes-88-will-the-progressive-electoral-wave-roll-through-massachusetts/).

### Inferences
- WFP is the easier national collection starting point because its list can be expanded reproducibly. Its mixed-office rows still require office, identity, election and term reconciliation.
- Our Revolution requires collecting individual slates and earlier-cycle material, followed by independent chapter research.

### Gaps
- The WFP CT 2024 source discovered at `https://workingfamilies.org/ctwfp2024/` could not be retrieved: web cache miss and direct SSL failure. Do not treat its search snippet as inspected evidence.
- Direct bare-host WFP requests initially returned 403; the canonical www URL and a benign query variant returned 200. The WordPress page API returned 401. Public HTML and its own read-only pagination endpoint worked, without authentication or bypassing access controls.
- Our Revolution's former `https://ourrevolution.com/groups/` directory returned 404. A complete current list of official chapters and their endorsement archives was not established.
- WFP's national page links 18 state organization pages. Those links establish national recognition, not that every local endorsing body is listed. Individual chapter archives were not exhaustively audited.

## What coverage is established in each state?

### Takeaway
`wfp_or_coverage.tsv` contains exactly 100 rows: all 50 states for both organizations. Its positive status means a retrieved in-scope endorsement source exists. It never means that the state's qualifying roster is complete.

### Cited Findings
- WFP has retrieved in-scope rows for AZ, CA, CO, CT, DE, GA, MD, MA, MI, NM, NY, NC, OH, OR, PA, RI, SC, TN, TX, UT, WA and WI. Nine other state sections had no in-scope office rows on this particular national page: AR, FL, KY, LA, ME, MN, NE, NJ and WY. Nineteen states had no retrieved national section. The matrix preserves unknown chapter/history coverage for all of them. [National source and pagination](https://workingfamilies.org/candidates/).
- Our Revolution has retrieved in-scope sources for CA, CO, CT, GA, IL, MA, MD, ME, MI, MN, MO, NY, OH, OR, PA, TX, VT and VA. Exact per-state source URLs and years are in the table. Examples show mixed-office slates that require filtering. [Maryland](https://ourrevolution.com/md-house-senate-endorsements/), [Oregon](https://ourrevolution.com/progressive-slate-in-oregon/), [Virginia](https://ourrevolution.com/joshua-cole-delegate-virginia-hd-65/).
- WFP chapter inventory has 18 state links from national navigation. ORMA is an additional discovered chapter source, with affiliation confirmation still pending. The chapter inventory therefore has 19 entries and is explicitly partial. [WFP national navigation](https://workingfamilies.org/candidates/), [ORMA policy](https://ourrevolutionma.com/orma-candidate-endorsement-policy/).

### Inferences
- The two national source sets overlap substantially. Their union covers source availability in 28 states, not a complete roster in 28 states.
- The original nationwide launch gate remains unmet. A positive source in a state cannot close the state's historical and chapter gaps.

### Gaps
- WFP status totals: 22 verified source, 9 page-limited no in-scope entries, 19 not established.
- Our Revolution status totals: 18 verified source, 32 not established.
- No organization/state pair is marked not applicable. Absence from an index does not prove there is no official chapter or qualifying endorsement.
- Years in the matrix describe inspected page scope or dated records. A page headed 2026 does not establish each individual row's election date, particularly for mixed local-office lists.

## Can completeness be reconciled, and what remains before implementation?

### Takeaway
A national import is feasible, but nationwide current-term completeness cannot be claimed from the inspected sources. Historical governor sources, official chapter discovery and election/service joins are the remaining research work.

### Cited Findings
- WFP's source set includes state, local, federal and other statewide offices together. The national page and its load-more endpoint supply data for collection, not election outcomes. [Candidates](https://workingfamilies.org/candidates/).
- Our Revolution publishes individual current and historical slates and distinguishes office types in prose. Governor's Council, lieutenant governor and local offices must not be treated as governors or legislators. [MA 2024](https://ourrevolution.com/massachusetts-endorsements-2024/), [VT 2024](https://ourrevolution.com/vermont-endorsements-2024/).
- The accessible Our Revolution historical category begins in 2024, so that category cannot establish 2022 governor endorsements. [Past-Endorsement category](https://ourrevolution.com/category/past-endorsement/).

### Inferences
- Next, enumerate current officials and their winning elections from official state records, then locate qualifying endorsements for those elections. This makes older-source research finite and avoids importing every historical loser.
- Separately, reconcile 2026 endorsement lists with official results and term transitions. Preserve unresolved outcomes rather than infer wins from congratulatory language.
- Establish official chapter inventories through current parent-organization evidence. Chapter self-description should be retained as a lead if national confirmation is missing.
- Manual review should resolve source-year conflicts, primary-to-general endorsements, withdrawals and same-name matches. No policy on these unresolved matters was silently applied by this audit.

### Gaps
- Current service, term dates, election outcomes, withdrawn support and person-level deduplication have not been audited. The 493 WFP office-label rows must not be reported as eligible officials.
- No exhaustive 2022-2025 source set or all-chapter census exists in these files. State-level gaps remain even where a current national source was retrieved.
- Slim observation JSON files, the 100-row matrix and partial chapter inventory are the evidence artifacts. Temporary full HTML and full-text inspection copies were moved to `/private/tmp`, outside the repository.
