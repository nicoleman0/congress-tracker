import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { allMembers, districtsOf, getPhoto, getState, staleMembers, type Member } from "@/lib/data";
import { CHECKED_AT, checkedNow, formatChecked } from "@/lib/freshness";

test("only unresolved races older than 3 days are stale", () => {
  const base = allMembers()[0];
  const mk = (status: Member["status"], checkedAt: string): Member => ({ ...base, id: status + checkedAt, status, checkedAt });
  const now = new Date("2026-11-12T12:00:00Z");
  const stale = staleMembers(
    [mk("leading", "2026-11-08"), mk("pending", "2026-11-10"), mk("won", "2026-11-01"), mk("incumbent", "2026-11-01")],
    now,
  );
  assert.deepEqual(stale.map((m) => m.id), ["leading2026-11-08"]);
});

test("roster loads and passes validation", () => {
  assert.ok(allMembers().length > 0);
});

test("every House district exists in its state", () => {
  for (const m of allMembers().filter((x) => x.office === "house")) {
    const state = getState(m.state)!;
    assert.ok(districtsOf(state).includes(m.district!), `${m.id}: ${m.state} has no district ${m.district}`);
  }
});

test("no two House members share a seat unless the race is unresolved", () => {
  const seats = new Map<string, string[]>();
  for (const m of allMembers().filter((x) => x.office === "house" && x.status !== "lost")) {
    const k = `${m.state}-${m.district}`;
    seats.set(k, [...(seats.get(k) ?? []), m.id]);
  }
  for (const [seat, ids] of seats) {
    if (ids.length < 2) continue;
    const statuses = ids.map((id) => allMembers().find((m) => m.id === id)!.status);
    assert.ok(statuses.every((s) => s === "pending"), `${seat} has ${ids.join(", ")}`);
  }
});

test("checked times: UTC to the minute, bare dates still shown and still judged", () => {
  assert.equal(checkedNow(new Date("2026-11-08T14:32:59.123Z")), "2026-11-08T14:32Z");
  assert.ok(CHECKED_AT.test("2026-11-08") && CHECKED_AT.test("2026-11-08T14:32Z") && !CHECKED_AT.test("2026-11-08 14:32"));
  assert.equal(formatChecked("2026-11-08T14:32Z"), "2026-11-08 14:32 UTC");
  assert.equal(formatChecked("2026-11-08"), "2026-11-08");
  const now = new Date("2026-11-12T12:00:00Z");
  const base = allMembers()[0];
  assert.equal(staleMembers([{ ...base, status: "leading", checkedAt: "2026-11-09T11:59Z" }], now).length, 1);
  assert.equal(staleMembers([{ ...base, status: "leading", checkedAt: "2026-11-09T12:01Z" }], now).length, 0);
});

test("every saved portrait has its file", () => {
  for (const m of allMembers()) {
    const p = getPhoto(m.id);
    if (p) assert.ok(fs.existsSync(`public${p.src}`), `${m.id}: missing ${p.src}`);
  }
});
