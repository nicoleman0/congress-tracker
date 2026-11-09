import { test } from "node:test";
import assert from "node:assert/strict";
import { convert } from "../scripts/roster-import";

const cite = { url: "https://example.org/a", excerpt: "A" };
const entry = (person: string, outcome: string, stage = "general") => ({
  person, office: "unicameral", district: "1", issuer: "Test WFP", group: "wfp",
  election: { year: 2024, stage }, source: cite, withdrawn: false, outcome, result_source: outcome === "won" ? cite : null,
  current: outcome === "won" ? { status: "serving", term_start: "2025-01-08", term_end: "2029-01-03", service_source: cite, contact_url: "https://example.org/c" } : null,
});
const file = (endorsements: ReturnType<typeof entry>[]) => [{
  state: "NE", researched_at: "2026-11-09", chambers: { unicameral: "Legislature" }, endorsements,
  coverage: ["wfp", "or", "dsa", "rfs", "pccc", "sunrise"].map((group) => ({ group, status: group === "wfp" ? "complete_with_entries" : "blocked", note: "n" })),
}];

test("wins become terms, other outcomes are excluded, unresearched states are in progress", () => {
  const b = convert(file([entry("Ann Winner", "won", "primary"), entry("Bob Pending", "pending")]), "2026-11-09");
  assert.equal(b.terms.length, 1);
  assert.equal(b.terms[0].election_id, "ne-unicameral-1-2024-general");
  assert.deepEqual(b.reconciliations.map((r) => r.outcome), ["included", "excluded"]);
  assert.equal(b.coverage.length, 300);
  assert.equal(b.coverage.find((c) => c.state === "CA")!.status, "in_progress");
});

test("conflicting spellings of one person fail loudly", () => {
  const a = entry("Ann Winner", "won"), b = { ...entry("Ann  Winner", "lost"), issuer: "Other" };
  assert.throws(() => convert(file([a, b]), "2026-11-09"), /conflicting rows/);
});
