import assert from "node:assert/strict";
import { test } from "node:test";
import { allMembers, type Member } from "@/lib/data";
import { blocSize, issueCoverage } from "@/lib/metrics";
import { dollars, mostOpposed, topSpenders, validateMoney, type Spend } from "@/lib/money";
import { candidateIdsFor, stageOf, summarize } from "../scripts/outside-money";

const base = allMembers()[0];
const mk = (id: string, over: Partial<Member> = {}): Member => ({ ...base, id, ...over });
const row = (committee: string, side: "S" | "O", amount: number, election = "P2026") => ({
  candidate_id: "H6CA22190", committee_id: committee, committee: { name: committee }, support_oppose_indicator: side,
  expenditure_amount: amount, election_type: election, memo_code: null,
});

test("summarize sums by committee, side and stage", () => {
  const out = summarize([row("C00000001", "O", 100), row("C00000001", "O", 50.5), row("C00000001", "O", 10, "G2026"), row("C00000002", "S", 7)]);
  assert.deepEqual(out.map((s) => [s.committee, s.side, s.stage, s.total, s.count]), [
    ["C00000001", "oppose", "primary", 150.5, 2],
    ["C00000001", "oppose", "general", 10, 1],
    ["C00000002", "support", "primary", 7, 1],
  ]);
});

test("summarize drops entries refunded to zero", () => {
  assert.deepEqual(summarize([row("C00000001", "O", 100), row("C00000001", "O", -100)]), []);
});

test("election types map to stages and unknown ones fail", () => {
  assert.equal(stageOf("P2026"), "primary");
  assert.equal(stageOf("R2026"), "primary");
  assert.equal(stageOf("G2026"), "general");
  assert.throws(() => stageOf(null));
  assert.throws(() => stageOf("X2026"));
});

test("candidate ids are filtered by office and state", () => {
  const ids = ["H6CA22190", "S6CA00123", "H4NY12345"];
  assert.deepEqual(candidateIdsFor(mk("x", { office: "house", state: "CA" }), ids), ["H6CA22190"]);
  assert.deepEqual(candidateIdsFor(mk("x", { office: "senate", state: "CA", district: null }), ids), ["S6CA00123"]);
});

test("top spenders and most opposed rank across members", () => {
  const a = mk("a"), b = mk("b");
  const s = (committee: string, side: Spend["side"], stage: Spend["stage"], total: number): Spend => ({ committee, name: committee, side, stage, total, count: 1 });
  const spending = {
    a: [s("C00000001", "oppose", "primary", 300), s("C00000002", "support", "general", 50)],
    b: [s("C00000001", "oppose", "primary", 100), s("C00000003", "oppose", "general", 500)],
  };
  const primary = topSpenders([a, b], "oppose", "primary", spending);
  assert.deepEqual(primary.map((x) => [x.committee, x.total, x.members.map((m) => m.member.id)]), [["C00000001", 400, ["a", "b"]]]);
  assert.deepEqual(topSpenders([a, b], "oppose", undefined, spending).map((x) => x.committee), ["C00000003", "C00000001"]);
  assert.deepEqual(mostOpposed([a, b], spending).map((x) => [x.member.id, x.against, x.for]), [["b", 600, 0], ["a", 300, 50]]);
});

test("money file rejects unknown members", () => {
  assert.throws(() => validateMoney({ cycle: 2026, checkedAt: "2026-11-08", missing: [], spending: { nobody: [] } }, new Set(["a"])));
});

test("dollars reads plainly", () => {
  assert.equal(dollars(3_578_983.45), "$3.6 million");
  assert.equal(dollars(36_700), "$36,700");
});

test("bloc size counts won and sitting members, apart from undecided races", () => {
  const list = [
    mk("h1", { office: "house", status: "won", incumbent: true }),
    mk("h2", { office: "house", status: "won", incumbent: false }),
    mk("h3", { office: "house", status: "leading", incumbent: true }),
    mk("s1", { office: "senate", district: null, status: "incumbent", incumbent: true }),
  ];
  const [house, senate] = blocSize(list);
  assert.deepEqual(house, { office: "house", seated: 2, returning: 1, new: 1, unresolved: 1 });
  assert.deepEqual(senate, { office: "senate", seated: 1, returning: 1, new: 0, unresolved: 0 });
});

test("issue coverage counts members per issue and bill records apart", () => {
  const stance = (kind: "campaign" | "congress") => ({ issue: "labor", text: "t", kind, source: { label: "s", url: "https://x" }, checkedAt: "2026-11-08" });
  const platform = (id: string) => ({ a: [{ issue: "labor", name: "Labor", stances: [stance("congress")] }], b: [{ issue: "labor", name: "Labor", stances: [stance("campaign")] }] }[id] ?? []);
  const [labor] = issueCoverage([mk("a"), mk("b"), mk("c")], platform);
  assert.deepEqual([labor.members.map((m) => m.id), labor.onRecord.map((m) => m.id)], [["a", "b"], ["a"]]);
});
