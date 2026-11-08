import { test } from "node:test";
import assert from "node:assert/strict";
import { canonical, validateInput } from "../scripts/state-offices";

const empty = () => ({ people: [], seats: [], sources: [], elections: [], terms: [], issuers: [], endorsements: [], reconciliations: [], coverage: [] });

test("batch hash input ignores object and row ordering", () => {
  assert.equal(canonical({ a: [{ id: "b" }, { id: "a" }], b: 1 }), canonical({ b: 1, a: [{ id: "a" }, { id: "b" }] }));
  assert.equal(canonical(new Date("2026-11-08T00:00:00Z")), '"2026-11-08T00:00:00.000Z"');
});

test("batch validation rejects unknown fields, malformed rows and non-state coverage", () => {
  assert.doesNotThrow(() => validateInput(empty()));
  assert.throws(() => validateInput({ ...empty(), extra: [] }), /unknown input table/);
  assert.throws(() => validateInput({ ...empty(), people: [{ id: "a", name: "A", extra: true }] }), /unknown field/);
  assert.throws(() => validateInput({ ...empty(), people: [{}] }), /id is required/);
  assert.throws(() => validateInput({ ...empty(), coverage: [{ state: "DC" }] }), /invalid state/);
});
