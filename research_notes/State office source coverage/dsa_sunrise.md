# DSA and Sunrise state office sources

## Which national lists, chapter directories and historical sources are available?

### Takeaway

Sunrise has an extractable official hub directory, but its national endorsement archive does not substitute for local endorsement records. DSA has national current/past lists and a chapter directory, but their embedded tables did not expose rows to the retrieval methods used in this audit.

### Cited Findings

- DSA's current-campaign page explicitly distinguishes national endorsements from local endorsements and directs readers to chapter websites for the latter. The table is an embedded Airtable. Its past-endorsement page also embeds Airtable and advertises an export. The web reader returned only a shell for both embeds. [Current campaigns](https://electoral.dsausa.org/our-campaigns/), [Past endorsements](https://electoral.dsausa.org/our-campaigns/past-endorsements/).
- DSA's chapter directory says its full list is sorted by state and embeds an Airtable. That embed also returned a shell rather than chapter rows. The ZIP lookup is an alternative discovery tool, not an audited nationwide export. [Chapter directory](https://www.dsausa.org/chapters/).
- Sunrise's national hub page embeds a map whose HTML declares `https://storage.googleapis.com/hub-data/hubs.json` as its data source. Direct retrieval succeeded on 8 November 2026. The JSON contained **111 directory records: 107 in 33 states and four in DC**. This counts records, not confirmed active hubs. Its `updated_at` was `2026-11-08 18:50:46 +0000`. A slim inventory is saved in `dsa_sunrise_chapters.tsv`, excluding leaders, emails, signup data and image metadata. [Official hub page](https://www.sunrisemovement.org/hubs/), [embedded map](https://storage.googleapis.com/hub-data/hub_map.html), [declared JSON](https://storage.googleapis.com/hub-data/hubs.json).
- Both pages of Sunrise's national endorsement archive were inspected. The visible records cover federal races and NYC mayor, rather than a state legislative roster. This is an observation about that retrieved archive, not an assertion that Sunrise never nationally endorsed a state official. [Page 1](https://www.sunrisemovement.org/endorsements/), [Page 2](https://www.sunrisemovement.org/endorsements/page/2/).

### Inferences

- Sunrise chapter affiliation can begin with the official directory snapshot. The statewide historical endorsement audit still requires a separate review of each applicable hub and earlier directories.
- DSA needs an accessible export or a browser-assisted inspection of its public embedded tables before a complete chapter inventory can be reconciled.

### Gaps

- No exhaustive DSA chapter enumeration was obtained. The three DSA entries in the chapter TSV are explicitly sampled leads, unlike the full current Sunrise JSON enumeration.
- Current-directory absence does not establish absence of historical chapters or endorsements.
- Neither organization has been established as a complete, machine-readable source for all current terms.

## What state-office evidence and years were actually verified?

### Takeaway

Retrieved primary sources establish in-scope endorsement-source availability for DSA in five states and Sunrise in one. These are source availability findings, not a final count of eligible officials or complete state coverage.

### Cited Findings

- **DSA, GA/KY/OR, 2026:** DSA's 22 May article describes a group of nationally endorsed state/local campaigns and names Georgia state House candidates, Kentucky's Robert LeVertis Bell and Oregon House District 27 candidate Tammy Carpenter. Its narrative uses election-win language during the primary season. Do not infer current service or a November general-election outcome from it. [National DSA article](https://www.dsausa.org/news/hot-dsa-electoral-wins-may-2026/).
- **DSA, NY, 2024:** NYC-DSA's release dated 7 December 2023 explicitly endorses eleven candidates for the 2024 State Senate/Assembly elections, including eight re-endorsements and a Mid-Hudson Valley issuer attribution. The page identifies NYC-DSA as DSA's local chapter. This supplies a concrete historical source and shows why endorser identity must be preserved. [Chapter release](https://socialists.nyc/press/nyc-dsa-endorses-eleven-candidates-for-state-office-including-three-challengers).
- **DSA, NY, 2026:** DSA's official publication describes Diana Moreno as DSA-endorsed in a state legislative special election. The same publication identifies Metro DC DSA and contains Illinois State Senate campaign leads; those Illinois leads were not separately reconciled to an issuing chapter endorsement record. [Democratic Left, 2 March 2026](https://democraticleft.dsausa.org/2026/03/02/chapters-prepare-for-a-busy-electoral-season-in-2026/).
- **DSA, MD, 2026:** Metro DC DSA's retrieved endorsement page explicitly lists Gabriel Acevero for House of Delegates District 39 and Raaheela Ahmed for State Senate District 23 under the Maryland Democratic primary. The Virginia portion lists constitutional amendments, not people. That is not evidence of no Virginia legislative endorsements elsewhere or in earlier years. [Metro DC 2026 endorsements](https://mdcdsa.org/2026endorsements/).
- **Sunrise, NY, 2026:** Sunrise NYC publishes text-readable Assembly and State Senate endorsements. Its identity and website match the official Sunrise directory. The separate “Climate Champions” list must not be treated as a dated endorsement for the election winning a current term. [NYC endorsements](https://sunrisenyc.org/endorsements), [official directory](https://storage.googleapis.com/hub-data/hubs.json).
- **Sunrise, IL, 2020–2026:** Chicago's page has 2020, 2022, 2023, 2024 and 2026 sections, but the retrieved candidate evidence is image-only. Search and fetched text showed different section granularity, so neither is treated as a parsed candidate list. [Chicago endorsements](https://www.sunrisemovementchicago.org/endorsements).

### Inferences

- Existing source structures can support precise issuer, election-year and office fields, but require a reconciliation pass.
- Historical releases are more useful than generic champions lists for the approved current-term rule.

### Gaps

- No governor endorsement was independently verified from a retrieved DSA or Sunrise primary source in this bounded pass. Search leads for governor races are not evidence of zero governors or a verified endorsement.
- Current service, term dates, election outcomes, withdrawals and candidate identities were not independently reconciled. No final official eligibility count is reported.
- Most local chapter endorsement sites were not individually inspected. The matrix records this limitation instead of marking them reviewed-empty.

## Can these sources establish nationwide completeness, and what blocks it?

### Takeaway

They cannot yet establish nationwide completeness. The concrete next work is DSA table extraction, historical-source discovery, and a hub-by-hub endorsement review grounded in the saved Sunrise directory.

### Cited Findings

- DSA's national current/past tables and chapter list returned no rows. Public tracker `2026.electoral.dsausa.org` rendered a loading message; direct HTTP retrieval returned 403. The official November map had no readable text through web retrieval and direct HTTP retrieval returned 403. [Tracker](https://2026.electoral.dsausa.org/), [official map](https://democraticleft.dsausa.org/wp-content/uploads/2026/10/nov3_map.html), [current list](https://electoral.dsausa.org/our-campaigns/), [chapter list](https://www.dsausa.org/chapters/).
- Sampled Sunrise Seattle and Orange County website fetches failed. They remain affiliation-verified via the directory, with endorsement coverage blocked or unestablished. [Seattle](https://www.sunriseseattle.org/), [Orange County](https://sunriseoc.org/), [official directory](https://storage.googleapis.com/hub-data/hubs.json).
- The Madison Area DSA endorsement page was found through search, but retrieval failed at both its redirecting and canonical URLs. Search snippets about 2024/2026 are retained only as leads. [Madison lead](https://www.dsamadison.org/about-us/endorsements).

### Inferences

- **Suggested next pass:** obtain DSA's advertised public exports; enumerate its chapters; review Sunrise directory-linked websites and official socials; extract image-only lists with verification; locate prior-election archives; then reconcile each endorsement with election/service sources. No messages were sent to organizations in this audit.
- A current public chapter list can anchor affiliation evidence. It cannot prove that a historically issuing chapter did or did not exist.

### Gaps

- `dsa_sunrise_coverage.tsv` has exactly 100 rows, one per state and organization. DSA: 5 `verified_in_scope_source`, 45 `blocked`. Sunrise: 1 `verified_in_scope_source`, 3 `blocked`, 46 `not_established`. DSA blocked rows share a national extraction dependency; they are **not** 45 independently failed state-site audits. No row claims complete chapter coverage.
- The chapter inventory contains all 111 records from the fetched Sunrise JSON plus three sampled DSA chapter leads, not a complete inventory of both groups. DC records are preserved for directory reconciliation but excluded from the 50-state matrix.
- Method, record counts, source chain, update time and fetched JSON SHA-256 are saved in `dsa_sunrise_method.json`. The raw downloaded JSON remains only in `/private/tmp`; it was not added to the repository.
- The audit used direct primary web retrieval plus the map's explicitly linked public JSON. It did not use browser interaction to extract Airtable, OCR images, access private accounts or contact organizations. These are research artifacts only; no application code changed.

### Status definitions and reproduction

- `verified_in_scope_source`: a retrieved primary source names at least one governor/state-legislative endorsement for that state. This says nothing about present eligibility or completeness.
- `blocked`: a relevant source or extraction dependency was attempted but inaccessible or unreadable by the methods used. The `gaps` column identifies the actual dependency; it may be shared nationally.
- `not_established`: no verified in-scope source was obtained in this pass. This does not mean no endorsements exist.
- `inspected_no_in_scope_entries`: restricted to an identified inspected page, never an organization/state-wide absence claim. Not used in this matrix because the uncovered states retain larger gaps.
- `not_applicable`: requires an explicit office/geographic limitation proved by the organization. Not used here.

To reproduce the directory count without writing raw contact data to disk:

```bash
python3 - <<'PY'
import urllib.request, json, hashlib, collections
base = 'https://storage.googleapis.com/hub-data/'
html = urllib.request.urlopen(base + 'hub_map.html').read().decode()
assert base + 'hubs.json' in html
raw = urllib.request.urlopen(base + 'hubs.json').read()
data = json.loads(raw)
rows = data['map_data']
states = collections.Counter(r['state'] for r in rows)
print('updated_at', data['updated_at'])
print('sha256', hashlib.sha256(raw).hexdigest())
print('records', len(rows), 'DC', states.get('District of Columbia', 0))
print('states', len(set(states) - {'District of Columbia'}))
print('records_by_state', dict(sorted(states.items())))
PY
```

The source is live and may change. Compare its update time and checksum with `dsa_sunrise_method.json`; the saved slim inventory is the reviewed snapshot, not a promise of stable future counts.
