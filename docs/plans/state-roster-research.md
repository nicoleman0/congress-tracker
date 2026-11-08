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
- **Start from saved evidence.** First grep `research_notes/` and `reports/state-endorsement-gap-review.tsv` for the state code and its name. Reuse the source URLs found there. Then search for what's missing.
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
- **`current.status`:** follows the state's official term-start rule, cited in `notes`. `serving` if that term has started by today, `incoming` if it starts later. Swearing-in and profile pages don't matter.
- **`term_start` and `term_end`:** take these from an official source, such as a roster or the state's term rules in its constitution or statute. Cite it in `service_source` or `notes`. Compute `term_end` from the term length when no roster gives it.
- **`election.stage`:** the stage the endorsement was announced for. Announced before that cycle's primary means `primary`; after it, `general`. If the date is unknown, use `general` and say so in `notes`. `outcome` is always the final result for the seat in that cycle.
- **No election named:** an endorsement that names no election (for example "our endorsed legislators") is not an entry. List it in `gaps`.
- **`contact_url`:** required for every `serving` or `incoming` entry, because the site won't list anyone without one. Use the member's official legislature or governor page. For a new member with no page yet, use the chamber's member directory and say so in `notes`.
- **Results sources:** use official state results. Only when an official source blocks automated access or renders no text, cite Ballotpedia or reliable reporting, and record the blocked official URL in `gaps`.
- **Coverage rows:** `complete_*` means every in-scope cycle (2022 to 2026, governor included) was checked for that group. If any cycle or chapter wasn't checked, the status is `blocked` and the note names what's missing.
- **Run for Something:** a card in its endorsed-candidate directory counts as its endorsement. Use the card's text naming the person as the excerpt.
- **`coverage`:** give exactly one row per group, six in all.
  - `complete_*` means you checked the group's available sources for this state.
  - `blocked` means a source you needed was unavailable.

## When done

Report counts by group, by outcome and by current status, the gaps, and anything that doesn't fit this format.
