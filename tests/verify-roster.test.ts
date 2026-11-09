import { test } from "node:test";
import assert from "node:assert/strict";
import { shapeProblems } from "../scripts/verify-roster";

const cite = { url: "https://example.org/", excerpt: "Test Person" };
const good = () => ({
  state: "DE", researched_at: "2026-11-08", chambers: { upper: "Senate", lower: "House" }, gaps: [],
  endorsements: [{
    person: "Test Person", office: "lower", district: "12", issuer: "Test WFP", group: "wfp", issuer_source: null,
    election: { year: 2024, stage: "general" }, source: cite, withdrawn: false, outcome: "won", result_source: cite,
    current: { status: "serving", term_start: "2024-11-06", term_end: "2026-11-04", service_source: cite, contact_url: "https://example.org/" as string | null }, notes: "",
  }],
  coverage: ["wfp", "or", "dsa", "rfs", "pccc", "sunrise"].map((group) => ({ group, status: group === "wfp" ? "complete_with_entries" : "complete_no_entries", checked: [], note: "checked" })),
});

test("a well-formed research file has no shape problems", () => {
  assert.deepEqual(shapeProblems(good(), "2025-06-01"), []);
});

test("serving status must match the term dates", () => {
  assert.ok(shapeProblems(good(), "2027-01-01").some((p) => /status serving contradicts term/.test(p)));
});

test("a listed term needs a contact link", () => {
  const r = good();
  r.endorsements[0].current.contact_url = null;
  assert.ok(shapeProblems(r, "2025-06-01").some((p) => /contact_url required/.test(p)));
});

test("research shape catches unsourced wins and contradictory coverage", () => {
  const r = good();
  r.endorsements[0].result_source = null as unknown as typeof cite;
  r.endorsements[0].current.service_source = null as unknown as typeof cite;
  r.coverage[0].status = "complete_no_entries";
  r.coverage.pop();
  const p = shapeProblems(r);
  for (const m of [/result: source required/, /service: source required/, /claims none but entries listed/, /one row per group/]) assert.ok(p.some((x) => m.test(x)), m.source);
  const gov = good();
  Object.assign(gov.endorsements[0], { office: "governor", group: "rfs" });
  assert.ok(shapeProblems(gov).some((x) => /district must be null/.test(x)) && shapeProblems(gov).some((x) => /RFS does not endorse governors/.test(x)));
});
