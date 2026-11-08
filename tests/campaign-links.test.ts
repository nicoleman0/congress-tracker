import assert from "node:assert/strict";
import { test } from "node:test";
import type { Member } from "@/lib/data";
import { normalizeSite, pickCandidate, type FecCandidate } from "../scripts/campaign-links";

const member = (o: Partial<Member>): Member => ({
  id: "x", name: "Melat Kiros", office: "house", incumbent: false, state: "CO", district: "1",
  endorsedBy: ["WFP"], status: "won", note: "", source: { label: "", url: "https://x" }, checkedAt: "2026-11-08", ...o,
});
const cand = (name: string, district: string): FecCandidate => ({
  candidate_id: "H1", name, district, principal_committees: [{ committee_id: "C00000001", cycles: [2026] }],
});

test("normalizeSite: bare Form 1 hosts become https, .gov and junk are rejected", () => {
  assert.equal(normalizeSite("WWW.KIROSFORCO.COM"), "https://www.kirosforco.com");
  assert.equal(normalizeSite("http://example.com/Donate/"), "https://example.com/Donate");
  assert.equal(normalizeSite("https://tlaib.house.gov"), null);
  assert.equal(normalizeSite(""), null);
  assert.equal(normalizeSite(null), null);
  assert.equal(normalizeSite("not a url at all"), null);
});

test("pickCandidate: matches on district, last name and first initial or nickname", () => {
  assert.equal((pickCandidate(member({}), [cand("KIROS, MELAT", "01"), cand("KIROS, MELAT", "02")]) as FecCandidate).district, "01");
  const bob = member({ name: "Bob Brooks", state: "PA", district: "7" });
  assert.equal(typeof pickCandidate(bob, [cand("BROOKS, ROBERT BOB", "07")]), "object");
  assert.equal(typeof pickCandidate(bob, [cand("BROOKS, ROBERT", "07")]), "string");
  const vt = member({ name: "Becca Balint", state: "VT", district: "AL" });
  assert.equal(typeof pickCandidate(vt, [cand("BALINT, REBECCA A", "00")]), "string"); // Nickname not on file: manual check.
});

test("pickCandidate: two matches is reported, not guessed", () => {
  assert.match(pickCandidate(member({}), [cand("KIROS, MELAT", "01"), cand("KIROS, MARK", "01")]) as string, /2 FEC candidates/);
});
