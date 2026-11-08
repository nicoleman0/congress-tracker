# State endorsement gap review

Checked 8 November 2026. **Source coverage improved, but nationwide roster completeness is not established.** No state has completed current-term eligibility, service and election-result reconciliation. The [300-row matrix](state-endorsement-gap-review.tsv) records historical source availability, not eligible-official counts or complete states.

| Group | States with retrieved in-scope evidence |
| --- | ---: |
| Run for Something | 50 |
| Working Families Party | 24 |
| Our Revolution | 18 |
| DSA | 27 |
| Sunrise | 6 |
| PCCC | 8 |

- **DSA:** recovered current/past Airtable tables and 252 directory records: 211 chapters and 41 organizing committees. The state category contains 85 legislative rows among 86 records. Review attempted 191 directory websites and 126 subpages. Alternative public-source checks covered 25 chapters without websites; 36 website-less organizing committees remain unreviewed.
- **Sunrise:** reviewed against the 111-record hub inventory. Recovered Chicago and Connecticut image endorsements. Orange County endorsements were separated from recommendations.
- **WFP/Our Revolution:** processed all 19 WFP state pages and 88 new leads, recording 178 sources. Our Revolution still lacks a complete chapter census. Twenty-one ORMA newsletters remain inaccessible; 19 partial-context screens do not close those gaps.
- **RFS:** corrected the General Assembly classifier, recovering three 2025 New Jersey cards. The 2022–2026 source union now covers 50 states. The 535 headline total remains unreconciled; five proposed aliases remain unmerged and six release-only candidacies remain open.
- **PCCC:** eight historical source-positive states are established, including 2025 New Jersey evidence from primary reporting quoting its cofounder. The blanket meaning of champions lists remains unresolved. Evidence is not restricted to issuer-domain pages.

Governor coverage remains incomplete. Next work is current-term reconciliation and closure of the recorded source gaps, not more unbounded discovery. Detailed evidence and limitations are in the [research artifacts](../research_notes/State%20endorsement%20gap%20review/).

**Storage decision adopted:** Neon PostgreSQL will be the canonical editable store, with reviewed versioned snapshots generated for the site. JSON snapshots are publication artifacts, not a second authoring source. No database was provisioned, application code changed or migration run.
