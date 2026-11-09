import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { canonical } from "../lib/canonical";
import { readStatePublication, stateSeatLabel } from "../lib/state-offices";
import { STATES } from "../lib/states";

function fixture() {
  const source = { id: "source", label: "Test source", url: "https://example.org/", checked_at: "2026-11-08" };
  return {
    version: "test", batch: { reviewed_at: "2026-11-08" },
    people: [{ id: "synthetic", name: "Test Person", portrait_url: null, portrait_credit: null, portrait_source_id: null }],
    seats: [{ id: "seat", state: "NE", office: "unicameral", chamber: "Legislature", district: "A", seat_label: "Seat 2", capacity: 2 }],
    sources: [source], elections: [{ id: "election", seat_id: "seat", year: 2026, stage: "general", cycle_election_id: null as string | null }],
    issuers: [{ id: "issuer", name: "Test Chapter", group_code: "dsa", parent_id: "parent", affiliation_source_id: "source" }],
    endorsements: [{ id: "endorsement", person_id: "synthetic", issuer_id: "issuer", election_id: "election", source_id: "source", withdrawn: false }],
    reconciliations: [{ id: "decision", endorsement_id: "endorsement", outcome: "included", reason: "Test", term_id: "term" }],
    terms: [{ id: "term", person_id: "synthetic", seat_id: "seat", election_id: "election", starts_on: "2026-01-01", ends_on: "2030-01-01", status: "serving", service_source_id: "source", result_source_id: "source", contact_url: "https://example.org/", contact_source_id: "source", campaign_url: null, campaign_source_id: null }],
    coverage: STATES.filter((s) => s.code !== "DC").flatMap((s) => ["wfp", "or", "dsa", "rfs", "pccc", "sunrise"].map((group_code) => ({ state: s.code, group_code, status: s.code === "NE" && group_code === "dsa" ? "complete_with_entries" : "complete_no_entries", note: "Checked.", checked_at: "2026-11-08" }))),
  };
}
function envelope(snapshot: ReturnType<typeof fixture>) {
  return { version: snapshot.version, sha256: createHash("sha256").update(canonical(snapshot)).digest("hex"), snapshot };
}

test("only a reviewed, unmodified snapshot with every coverage row loads", () => {
  assert.deepEqual(readStatePublication(null).members, []);
  const data = fixture();
  const result = readStatePublication(envelope(data), new Date("2026-11-08"));
  assert.equal(result.members[0].endorsers[0].issuer.name, "Test Chapter");
  assert.equal(stateSeatLabel(result.members[0]), "NE Legislature · District A · Seat 2");
  data.coverage[0].status = "blocked";
  assert.equal(readStatePublication(envelope(data), new Date("2026-11-08")).coverage[0].status, "blocked");
  data.coverage[0].note = " ";
  assert.throws(() => readStatePublication(envelope(data)), /missing coverage rows/);
  data.coverage.shift();
  assert.throws(() => readStatePublication(envelope(data)), /missing coverage rows/);
  const invalid = envelope(fixture());
  invalid.snapshot.people[0].name = "Changed";
  assert.throws(() => readStatePublication(invalid), /hash mismatch/);
});

test("missing evidence and stale or expired terms fail closed", () => {
  const missing = fixture(); missing.endorsements[0].withdrawn = true;
  assert.throws(() => readStatePublication(envelope(missing), new Date("2026-11-08")), /missing evidence/);
  assert.throws(() => readStatePublication(envelope(fixture()), new Date("2031-01-01")), /invalid term/);
  const future = fixture(); future.terms[0].status = "incoming";
  assert.throws(() => readStatePublication(envelope(future), new Date("2026-11-08")), /invalid term/);
});

test("a seat cannot list more incoming winners than it holds", () => {
  const data = fixture();
  for (const n of [1, 2, 3]) {
    data.people.push({ ...data.people[0], id: `p${n}` });
    data.endorsements.push({ ...data.endorsements[0], id: `e${n}`, person_id: `p${n}` });
    data.terms.push({ ...data.terms[0], id: `t${n}`, person_id: `p${n}`, status: "incoming", starts_on: "2027-01-01" });
    data.reconciliations.push({ ...data.reconciliations[0], id: `r${n}`, endorsement_id: `e${n}`, term_id: `t${n}` });
  }
  assert.throws(() => readStatePublication(envelope(data), new Date("2026-11-08")), /seat capacity exceeded/);
  data.terms.pop();
  assert.equal(readStatePublication(envelope(data), new Date("2026-11-08")).members.length, 3);
});

test("uncalled races are not listed", () => {
  const data = fixture();
  data.terms.push({ ...data.terms[0], id: "race", status: "unresolved", starts_on: "2027-01-01", ends_on: null as unknown as string, service_source_id: null as unknown as string });
  data.reconciliations.push({ ...data.reconciliations[0], id: "race-decision", endorsement_id: "race-endorsement", term_id: "race" });
  data.endorsements.push({ ...data.endorsements[0], id: "race-endorsement" });
  const members = readStatePublication(envelope(data), new Date("2026-11-08")).members;
  assert.deepEqual(members.map((m) => m.term.id), ["term"]);
});

test("primary endorsement qualifies only for its linked election", () => {
  const data = fixture();
  data.elections.push({ id: "primary", seat_id: "seat", year: 2026, stage: "primary", cycle_election_id: "election" });
  data.endorsements[0].election_id = "primary";
  assert.equal(readStatePublication(envelope(data), new Date("2026-11-08")).members.length, 1);
  data.elections[1].cycle_election_id = "different-election";
  assert.throws(() => readStatePublication(envelope(data), new Date("2026-11-08")), /missing evidence/);
});
