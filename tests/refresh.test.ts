import assert from "node:assert/strict";
import { test } from "node:test";
import type { Member } from "@/lib/data";
import { decide, nbcUrl, type Race } from "../scripts/refresh";

const member = (over: Partial<Member>): Member => ({
  id: "x", name: "Cait Conley", office: "house", incumbent: false, state: "NY", district: "17",
  endorsedBy: ["WFP"], status: "leading", note: "", source: { label: "", url: "https://x" }, checkedAt: "2026-11-08",
  ...over,
});
const race = (call: string, cands: [string, number, boolean][]): Race => ({
  officeCode: "H", callStatusCode: call, percentIn: 95,
  candidates: cands.map(([name, percentVote, isWinner]) => ({ name, percentVote, isWinner })),
});

test("projected winner becomes won", () => {
  const d = decide(member({}), [race("P", [["Cait Conley", 53, true], ["Mike Lawler", 46.9, false]])]);
  assert.deepEqual(d, { status: "won", note: "Beat Mike Lawler." });
});

test("another projected winner means lost", () => {
  const d = decide(member({ name: "Justin J. Pearson" }), [race("P", [["Brent Taylor", 49.6, true], ["Justin Pearson", 48.5, false]])]);
  assert.deepEqual(d, { status: "lost", note: "Lost to Brent Taylor." });
});

test("no call: ahead is leading, behind is pending", () => {
  const r = [race("", [["Cait Conley", 51, false], ["Mike Lawler", 49, false]])];
  assert.equal(("status" in decide(member({}), r)) && (decide(member({}), r) as { status: string }).status, "leading");
  assert.deepEqual(decide(member({}), r), { status: "leading", note: "Leads Mike Lawler, 51% to 49%, with 95% of the vote counted." });
  const r2 = [race("", [["Mike Lawler", 51, false], ["Cait Conley", 49, false]])];
  assert.deepEqual(decide(member({}), r2), { status: "pending", note: "Trails Mike Lawler, 49% to 51%, with 95% of the vote counted." });
});

test("name suffixes and accents still match; wrong person is an error", () => {
  const d = decide(member({ name: "Frederick Haynes III" }), [race("P", [["Frederick Haynes", 80, true], ["Someone Else", 20, false]])]);
  assert.equal((d as { status: string }).status, "won");
  const miss = decide(member({ name: "Linda Sánchez" }), [race("P", [["Other Person", 60, true], ["Another One", 40, false]])]);
  assert.ok("error" in miss);
});

test("URLs: at-large uses district 1, Senate has its own page, DC has none", () => {
  assert.match(nbcUrl(member({ state: "VT", district: "AL" }))!, /vermont-us-house-district-1-results$/);
  assert.match(nbcUrl(member({ office: "senate", state: "NY", district: null }))!, /new-york-senate-results$/);
  assert.equal(nbcUrl(member({ state: "DC", district: "AL" })), null);
});

test("multi-word last names match and unopposed races don't crash", () => {
  const r: Race = { officeCode: "H", callStatusCode: "P", percentIn: 90,
    candidates: [{ name: "Darializa Avila Chevalier", lastName: "Avila Chevalier", percentVote: 100, isWinner: true }] };
  const d = decide(member({ name: "Darializa Avila Chevalier" }), [r]);
  assert.deepEqual(d, { status: "won", note: "Ran unopposed." });
});
