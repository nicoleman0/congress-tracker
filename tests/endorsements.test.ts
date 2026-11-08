import assert from "node:assert/strict";
import { test } from "node:test";
import { endorsementFile, staleEndorsements, validateEndorsements, type EndorsementFile } from "@/lib/endorsements";
import { upsert } from "../scripts/add-endorsement";

const groups = new Set(["JD", "WFP"]);
const empty = (): EndorsementFile => ({ cycle: 2028, candidates: [] });
const add = (f: EndorsementFile, group = "JD") =>
  upsert(f, group, "ny-10-x", "https://example.org/x", "2026-11-08",
    { name: "X Person", office: "house", state: "NY", district: "10", seat: "open" });

test("shipped file loads and validates", () => {
  assert.equal(endorsementFile().cycle, 2028);
});

test("upsert adds a candidate, then a second group, and refreshes an existing one", () => {
  const f = add(add(empty()), "WFP");
  assert.deepEqual(f.candidates[0].endorsements.map((e) => e.group), ["JD", "WFP"]);
  upsert(f, "JD", "ny-10-x", "https://example.org/new", "2026-12-01", {});
  assert.equal(f.candidates[0].endorsements[0].url, "https://example.org/new");
  assert.equal(f.candidates[0].endorsements.length, 2);
  validateEndorsements(f, groups);
});

test("validation rejects bad input", () => {
  const bad = (mut: (f: EndorsementFile) => void, re: RegExp) => {
    const f = add(empty());
    mut(f);
    assert.throws(() => validateEndorsements(f, groups), re);
  };
  bad((f) => { f.candidates[0].endorsements[0].group = "ZZ"; }, /unknown group/);
  bad((f) => { f.candidates[0].endorsements[0].url = "http://x"; }, /https/);
  bad((f) => { f.candidates[0].endorsements[0].checkedAt = "yesterday"; }, /checkedAt/);
  bad((f) => { f.candidates[0].seat = "maybe" as never; }, /bad seat/);
  bad((f) => { f.candidates[0].district = null; }, /needs a district/);
  bad((f) => { f.candidates[0].endorsements = []; }, /no endorsements/);
  bad((f) => { f.candidates.push({ ...f.candidates[0] }); }, /duplicate id/);
});

test("endorsements go stale after 180 days, with no race status involved", () => {
  const f = add(empty());
  assert.equal(staleEndorsements(f, new Date("2027-05-01T00:00:00Z")).length, 0);
  assert.deepEqual(staleEndorsements(f, new Date("2027-06-01T00:00:00Z")), [{ id: "ny-10-x", group: "JD", checkedAt: "2026-11-08" }]);
});
