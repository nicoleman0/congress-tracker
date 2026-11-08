import assert from "node:assert/strict";
import { test } from "node:test";
import { allMembers, type Member } from "@/lib/data";
import { billUrl, matches } from "../scripts/record";

const base = allMembers()[0];
const house: Member = { ...base, name: "Greg Casar", office: "house", state: "TX", district: "37" };
const senate: Member = { ...base, name: "Bernie Sanders", office: "senate", state: "VT", district: null };

test("matches a cosponsor by state, chamber, last name and first initial", () => {
  assert.ok(matches(house, { firstName: "Greg", lastName: "Casar", state: "TX", district: 35 }), "renumbered seat");
  assert.ok(!matches(house, { firstName: "Joaquin", lastName: "Casar", state: "TX", district: 20 }));
  assert.ok(!matches(house, { firstName: "Greg", lastName: "Casar", state: "CA", district: 37 }));
  assert.ok(matches(senate, { firstName: "Bernard", lastName: "Sanders", state: "VT" }));
  assert.ok(!matches(senate, { firstName: "Bernard", lastName: "Sanders", state: "VT", district: 0 }));
});

test("bill urls point at congress.gov", () => {
  assert.equal(billUrl({ issue: "labor", congress: 119, type: "hr", number: 20, name: "PRO Act" }),
    "https://www.congress.gov/bill/119th-congress/house-bill/20");
});
