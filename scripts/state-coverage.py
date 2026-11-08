"""Convert the saved audit into an incomplete import batch."""
import csv
import json
import sys

GROUPS = {
    "WFP": "wfp", "Our Revolution": "or", "DSA": "dsa",
    "RFS": "rfs", "PCCC": "pccc", "Sunrise": "sunrise",
}

if len(sys.argv) != 3:
    raise SystemExit("usage: python3 scripts/state-coverage.py MATRIX OUTPUT")

with open(sys.argv[1], encoding="utf-8", newline="") as source:
    rows = list(csv.DictReader(source, delimiter="\t"))
coverage = []
for row in rows:
    code = GROUPS[row["organization"]]
    # Source availability is not a completed eligibility or service audit.
    note = "; ".join(f"{key}: {row[key]}" for key in ("status", "years", "offices", "source_urls", "gaps") if row[key])
    coverage.append({"state": row["state"], "group_code": code, "status": "in_progress", "note": note, "checked_at": "2026-11-08"})
if len(coverage) != 300 or len({(row["state"], row["group_code"]) for row in coverage}) != 300:
    raise SystemExit("expected 300 distinct state/group rows")
batch = {name: [] for name in ("people", "seats", "sources", "elections", "terms", "issuers", "endorsements", "reconciliations")}
batch["coverage"] = coverage
with open(sys.argv[2], "x", encoding="utf-8") as target:
    json.dump(batch, target, ensure_ascii=False, indent=2)
    target.write("\n")
