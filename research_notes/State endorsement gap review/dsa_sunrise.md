# DSA and Sunrise endorsement gap review

Reviewed 8 November 2026. Research only. Prior audit files are unchanged.

## What chapter and national source gaps were closed?

### Takeaway

The DSA directory and both national endorsement grids are now extractable from their public rendered HTML. The pass also attempted the linked public sites for the current DSA and Sunrise directory records, recording method-specific failures rather than treating missing sources as zero endorsements.

### Cited Findings

- DSA's official directory embeds a public Airtable with **252 rows:211 Chapters and41 Organizing Committees**. All252 grid-row indices were recovered, matching the displayed total. Only state, chapter name, type, website and public organization links were retained. There are191 nonempty unique website fields. Of61 records without a website,25 are Chapters and36 are OCs. The directory is a current snapshot, not a historical directory or proof that all records are active. [Official directory](https://www.dsausa.org/chapters/), [public embed](https://airtable.com/embed/appVbWrpnpZXvsVJH/shrorpPIHVt83eIq0?backgroundColor=gray&viewControls=on).
- Direct retrieval attempted all191 website URLs and126 discovered same-host election/endorsement links.164 roots were readable and27 inaccessible. For the25 Chapters with no website field,52 directory-linked public social/Linktree URLs were attempted. Four remaining exact-name chapter searches found primary pages for Chippewa Valley and Laredo, but no verified in-scope endorsement list there. OCs are retained separately and never automatically treated as approved chapter issuers. [Directory](https://www.dsausa.org/chapters/), [Chippewa Electoral page](https://chippewavalley.chapters.dsausa.org/electoral/), [Laredo group](https://actionnetwork.org/groups/laredo-dsa-2).
- Sunrise review covers the prior111-record official directory snapshot:110 records have an actual public URL attempt and one has no website/microsite/social link.129 distinct root, microsite or social URLs and nine discovered same-host electoral links were fetched. This is a finite current-directory pass; retired hubs and deeper historical archives remain outside the enumeration. [Official directory data](https://storage.googleapis.com/hub-data/hubs.json), [affiliation page](https://www.sunrisemovement.org/hubs/).

### Inferences

- The previous DSA extraction blocker is closed without an account, private API or access bypass. National public tables can supply reviewed factual snapshots.
- A current chapter inventory supplies a finite starting queue, but cannot establish that every historical issuer or endorsement has been found.

### Gaps

- The local CUA browser was unavailable:creating an IAB tab failed and browser inventory was empty. A Firecrawl public browser attempt to click Download CSV timed out after 50 seconds. A subsequent direct public-embed HTML scrape exposed all grid rows, so no CSV download was needed or claimed.
- Official social profiles often returned login shells or profile metadata without posts. No private Discord, signup or login was used. The review table identifies inaccessible sources and distinguishes these from a readable page with no relevant list found.
- State labels in the DSA directory can span several states; they are preserved rather than forcing a chapter into one state.

## Which historical and state-office sources are now established?

### Takeaway

DSA public grids yielded 377 total rows across current and past tables. **86 rows have the broad State label, but only 85 describe legislative offices.** They are endorsement records across elections, not 85 unique people or verified current officials.

### Cited Findings

- The past grid contains327 records dated2016–2025.63 carry the State category, including a2019 Louisiana Agriculture and Forestry Commissioner campaign that is outside this feature. The current grid has50 records dated2026,23 labeled State and describing legislative offices. All grid indices matched displayed record totals. Saved factual state rows preserve issuer chapters and election dates, with an explicit scope flag. [Past grid](https://airtable.com/embed/app41ni7RJppgXEBL/shrlm0oDQJkJsCnSr?backgroundColor=grayLight&viewControls=on), [current grid](https://airtable.com/embed/app41ni7RJppgXEBL/shrlP3Do8lp7E52Ev?backgroundColor=grayLight&viewControls=on).
- The national history includes legislative records from2021,2022 and2024. The grid also contains2023/2025 records overall, but none of its State-labeled rows have those election years. This is limited to this national grid, not all local endorsements. Underspecified offices from multistate issuers remain unmapped, and district notation such as SD-17 is not treated as South Dakota. [Past grid](https://airtable.com/embed/app41ni7RJppgXEBL/shrlm0oDQJkJsCnSr?backgroundColor=grayLight&viewControls=on).
- Madison's old endorsement URL now returns404 through rendered retrieval. Its accessible2025 annual chapter report independently records2024 Assembly endorsements for Francesca Hong and Maia Pearson. Maine's2026 endorsement page names Lucy Perkins for House121. Maine's directory-linked Bluesky account provides a dated9 May2026 primary endorsement of Troy Jackson for governor. None of these sources establish present service or general-election outcome. [Madison report](https://www.dsamadison.org/2025-annual-chapter-report), [Maine list](https://www.mainedsa.org/endorsements/), [Maine governor post](https://bsky.app/profile/mainedsa.org/post/3mlgc3yloxs2s), [account affiliation](https://www.dsausa.org/chapters/).
- Sunrise Chicago's section headings distinguish2026 general/primary,2024 general/primary,2023 municipal,2022 primary and2020 primary records.21 images were read visually; seven state-legislative endorsement records were confirmed:2024 Graciela Guzmán SD20, Theresa Mah HD24 and Lilian Jiménez HD4;2026 Nick Uniejewski SD6, Guzmán SD20, Jiménez HD4 and Miguel Alvelo-Rivera HD40. Year comes from the containing page section; outcome and current term are not inferred. Unread images remain labeled unread. [Chicago source](https://www.sunrisemovementchicago.org/endorsements).
- Sunrise Connecticut's2024 page and three visually read graphics establish Tyler Mack SD22, David Michel HD146 and Laurie Sweet HD91. The page explicitly says its endorsements do not imply national Sunrise endorsement. [Connecticut source](https://sunriseconnecticut.wixsite.com/website/about-1).
- Sunrise Orange County's2026 guide explicitly endorses Jessie Lopez for Assembly68 and Chris Kluwe for Assembly72. Its recommendations and consider-voting-Dem choices are different categories and do not qualify. Sunrise Ithaca explicitly endorses Anna Kelles for Assembly125 in2026. [Orange County](https://www.sunriseoc.org/voter-guides/orange-county), [Ithaca](https://sites.google.com/view/sunriseithaca/2026-endorsement).
- Sunrise Pittsburgh explicitly endorses La'Tasha Mayes for State House24, but that entry is undated. A neighboring2024 federal endorsement does not date the Mayes endorsement. [Pittsburgh](https://sites.google.com/view/sunrisepittsburgh/get-involved/endorsements).
- Sunrise's older category archive exposed a dated22 March2021 national release endorsing Jennifer Carroll Foy for Virginia governor. Sam Rasoul is explicitly a lieutenant-governor candidate and is excluded. This closes historical governor source availability, not current-term eligibility. [Older category](https://www.sunrisemovement.org/endorsement/), [original release](https://www.sunrisemovement.org/movement-updates/virginia-endorsements/).

### Inferences

- The 100-row comparison now records some in-scope primary endorsement-source availability for DSA in 27 states and Sunrise in six. Availability can be historical or undated:it is not complete coverage of current terms.
- National tables and local releases should be kept as separate evidence with exact issuer attribution. The grids cannot replace missing chapter history.

### Gaps

- Past-cycle source discovery is substantially improved, but 2022–2026 and odd-year 2021/2023/2025 chapter coverage is not reconciled everywhere. Some available state evidence predates 2021; the matrix records the exact years and warns against carrying an endorsement into a later term.
- No attempt was made to verify every person's election result, term dates, current service, appointment, retirement or withdrawn endorsement. This pass does not produce a final eligible-official count.
- Historical Sunrise governor leads in secondary reporting were not promoted to verified primary evidence. One recovered 2021 governor release does not prove complete 2022–2025 coverage.

## What remains before a reviewed nationwide snapshot can be claimed?

### Takeaway

The remaining work is source reconciliation, especially inaccessible/social-only issuers, retired chapters and election-specific historical gaps. The two national DSA extraction problems and several image sources no longer block collection.

### Cited Findings

- `dsa_sunrise_chapter_review.tsv` has363 rows:252 DSA and111 Sunrise records. DSA statuses are48 readable electoral sources,133 inspected/search-reviewed without a confirmed relevant page,35 inaccessible and36 unreviewed no-site OCs. Sunrise statuses are seven readable sources,42 inspected without a confirmed relevant page,60 inaccessible,one image-only unresolved and one unreviewed no-link record. Readable electoral sources may concern out-of-scope races; they are not automatically qualifying endorsement records. [DSA inventory anchor](https://www.dsausa.org/chapters/), [Sunrise inventory anchor](https://storage.googleapis.com/hub-data/hubs.json).
- `dsa_sunrise_gap_register.tsv` separates14 closed, partial and remaining gaps. `dsa_sunrise_coverage.tsv` preserves100 unique state/organization rows and source-year limitations. The HTTP ledgers record actual URLs, methods and retrieval outcomes; the verified-source ledger records only confirmed findings. [National DSA distinction between national and local endorsements](https://electoral.dsausa.org/our-campaigns/).

### Inferences

- Next work can be targeted at a recorded issuer and missing year instead of repeating a national search. A reviewed snapshot should retain source scope, year and unresolved limitations alongside the data.
- A final nationwide-completeness claim still requires a state-by-state reconciliation against current office/term inventories and explicit exclusions. This cannot be obtained by adding up source-list records.

### Gaps

- Raw HTML, downloaded images, OCR output and contact columns are not retained in the repository. Native OCR returned `nilError` on45 downloaded Chicago images;24 images in total were instead read visually:21 Chicago and three Connecticut. Other image rows are explicitly marked downloaded-but-unread or failed.
- This pass followed actual homepage links and at most four same-host electoral links per root; it did not crawl every article, archive page or social post. Different-host links requiring a further discovery pass remain leads.
- No external message, account signup, private export, database provisioning or application change occurred.

### Reproduction and status definitions

The public HTML extraction reads rendered `data-testid="gridCell-ROW:COLUMN"` elements, joins text from nested divs, and checks unique row indices against the visible record count. DSA directory columns0/1/2/4 supply state/name/status/website; public organization-link columns5–10 were retained separately, omitting email/calendar/signup columns. Current endorsement columns0–4 supply name/chapters/office/type/date. Past columns0/3/4/5/6/7 supply name/chapters/office/type/endorsement-label/date. No private Airtable endpoint was used.

Direct HTTP review used Python's standard-library URL reader and HTML parser, twelve concurrent workers for DSA or ten for Sunrise, a 12-second URL timeout and a 3.5 MB response cap. Script/style text was excluded; only short excerpts and electoral links were retained. Per-root follow-up was capped at four same-host links. The ledgers make each attempted URL inspectable.

Review statuses mean:readable_source = retrieved electoral/endorsement page, still requiring item-level scope/year reconciliation;inspected_no_relevant_page_found = the identified inspected pages or targeted searches yielded no confirmed relevant source, never an issuer-wide absence claim;inaccessible = actual attempted methods failed or produced a login/loading shell;image_only_unresolved = content exists but relevant image/date facts were not verified;unreviewed = no actual source attempt. Source matrix verified_in_scope_source means at least one primary in-scope endorsement source exists for the stated years, never current-term completion.
