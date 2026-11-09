# State roster research brief

One researcher handles one state and writes `research_notes/roster/<ST>.json`. A script checks every excerpt against its page, then converts reviewed files into an import batch. Read this whole brief before starting.

## Goal

Find every endorsement of a candidate for **governor or state legislature** in the state, from the elections listed below, by these groups or their verified official state/local chapters:

| code | group |
| --- | --- |
| `wfp` | Working Families Party |
| `or` | Our Revolution |
| `dsa` | Democratic Socialists of America (chapters only; organizing committees count only with evidence they endorse as DSA) |
| `rfs` | Run for Something (does not endorse governors) |
| `pccc` | Progressive Change Campaign Committee (a "champions" list alone is not an endorsement) |
| `sunrise` | Sunrise Movement (endorsements, not "recommendations") |

Then, for each endorsed person, record the election result and whether they hold or will take that office.

**Elections in scope:** every election whose winners hold a state legislative or governor term today (8 November 2026) or will take office from the 2026 elections. In practice: 2022, 2024 and 2026 cycles, plus 2023 and 2025 for states with odd-year elections, plus special elections since 2022. Include primary endorsements and record them with stage `primary`.

Include endorsees who lost. Every discovered endorsement must appear, so the reviewer can account for it.

## Rules

- **Never infer.** A win needs a results source. Service needs an official roster or legislature page. An endorsement needs the issuer's page, social post, or reliable reporting that quotes the issuer. If you can't source a field, set it to `null` or `"unknown"` and say why in `notes`.
- **Excerpts are verbatim.** Copy 5 to 30 words exactly as they appear in the page's text, including the person's name where possible. A script fetches each URL and rejects excerpts it can't find. Prefer pages that render as plain HTML. If the only evidence is an image or PDF, include it and set `"excerpt": null`, with a description in `notes`.
- **Name the actual issuer.** "Delaware Working Families Party", not "WFP". For chapters, also give the chapter's page as `issuer_source`.
- **Withdrawn endorsements** stay in the list with `"withdrawn": true`.
- **Stay in scope.** Skip federal, municipal, judicial, school board and other statewide offices (attorney general, lieutenant governor and so on).
- **Start from saved evidence.** These national lists are already saved. Use them before searching, and don't re-fetch them:
  - **WFP 2026:** `research_notes/national/wfp-2026-candidates.tsv` is the full list, including rows hidden behind "View More". Cite `https://workingfamilies.org/candidates/` with the row's name and office as the excerpt; the verifier checks it against the saved file. Earlier WFP cycles still need the state pages and news.
  - **DSA national tables:** the `records` in `research_notes/State endorsement gap review/dsa_sunrise_dsa_current_state_sources.json` and `..._past_state_sources.json`. Chapter sites and social feeds are still needed.
  - **Run for Something 2020–2026:** `research_notes/State endorsement gap review/rfs_pccc_directory_cards.tsv` (one row per card, with `profile_url`). Cite the `profile_url` and use the card text as the excerpt.
  - **Current legislators:** `research_notes/openstates/<ST>.csv` (Open States, CC0). Its `links` column has each member's official page. Use it for `service_source` and `contact_url` (see below).
  - Then grep `research_notes/` and `reports/state-endorsement-gap-review.tsv` for the state code and name, and search for what's missing: chapter pages, earlier cycles, OR, PCCC, Sunrise.
- **Bound the work.** Check each group's state pages, chapter pages and past-endorsement archives, then stop. When a source is unreachable or incomplete, record it as a gap. Don't keep searching indefinitely.

## Output

`research_notes/roster/<ST>.json`:

```json
{
  "state": "DE",
  "researched_at": "2026-11-08",
  "chambers": { "upper": "Senate", "lower": "House of Representatives" },
  "endorsements": [
    {
      "person": "Full Name",
      "office": "governor | upper | lower | unicameral",
      "district": "12",
      "issuer": "Delaware Working Families Party",
      "group": "wfp",
      "issuer_source": null,
      "election": { "year": 2024, "stage": "general | primary | special" },
      "source": { "url": "https://...", "excerpt": "verbatim words from the page" },
      "withdrawn": false,
      "outcome": "won | lost | pending | withdrew | unknown",
      "result_source": { "url": "https://...", "excerpt": "..." },
      "current": {
        "status": "serving | incoming | not_serving | unknown",
        "term_start": "2025-01-14",
        "term_end": "2027-01-12",
        "service_source": { "url": "https://...", "excerpt": "..." },
        "contact_url": "https://..."
      },
      "notes": ""
    }
  ],
  "coverage": [
    { "group": "wfp", "status": "complete_with_entries | complete_no_entries | blocked", "checked": ["https://..."], "note": "what was checked and what remains" }
  ],
  "gaps": ["unreachable sources, ambiguous evidence, open questions"]
}
```

- **`district`:** `null` for governor. Use the state's own district label, which may not be a number.
- **`current`:** fill this only when `outcome` is `won`, otherwise `null`. It describes **the term won in this election only**, never a later one. A 2022 winner whose 2022 term has ended is `not_serving`, even if re-elected; the re-election is its own entry only if a group endorsed it.
- **`current.status`:** follows the state's official term-start rule, cited in `notes`. `serving` if that term has started by today, `incoming` if it starts later. Swearing-in and profile pages don't matter. Someone who left mid-term (resigned, died, took another office) is `not_serving`, with the reason and its source in `notes`.
- **`term_start` and `term_end`:** take these from an official source, such as a roster or the state's term rules in its constitution or statute. Cite it in `service_source` or `notes`. Compute `term_end` from the term length when no roster gives it.
- **`election.stage`:** the stage the endorsement was announced for. Announced before that cycle's primary means `primary`; after it, `general`. If the date is unknown, use `general` and say so in `notes`. `outcome` is always the final result for the seat in that cycle.
- **No election named:** an endorsement that names no election (for example "our endorsed legislators") is not an entry. List it in `gaps`.
- **`service_source` and `contact_url`:** for a legislator in the Open States file, cite `https://data.openstates.org/people/current/<st>.csv` (lowercase state) with the member's name as the excerpt, and use the official page from the `links` column as `contact_url`. Members appear there only once seated, so for an `incoming` member use the chamber's official member directory and say so in `notes`. Governors: use the governor's official site. `contact_url` is required for every `serving` or `incoming` entry, because the site won't list anyone without one.
- **Results sources:** use official state results. Only when an official source blocks automated access or renders no text, cite Ballotpedia, Wikipedia or reliable reporting, and record the blocked official URL in `gaps`. If the race isn't called yet, `outcome` is `pending`. If you can't find a result at all, it is `unknown` with the reason in `notes`.
- **Coverage rows:** `complete_*` means every in-scope cycle (2022 to 2026, governor included) was checked for that group. If any cycle or chapter wasn't checked, the status is `blocked` and the note names what's missing.
- **Run for Something:** a card in its endorsed-candidate directory counts as its endorsement. Use the card's text naming the person as the excerpt.
- **`coverage`:** give exactly one row per group, six in all.

## When done

Report counts by group, by outcome and by current status, the gaps, and anything that doesn't fit this format.
