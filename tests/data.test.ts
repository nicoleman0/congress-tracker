import assert from "node:assert/strict";
import { test } from "node:test";
import { allMembers, districtsOf, getState, staleMembers, type Member } from "@/lib/data";

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
  for (const m of allMembers().filter((x) => x.office === "house")) {
    const k = `${m.state}-${m.district}`;
    seats.set(k, [...(seats.get(k) ?? []), m.id]);
  }
  for (const [seat, ids] of seats) {
    if (ids.length < 2) continue;
    const statuses = ids.map((id) => allMembers().find((m) => m.id === id)!.status);
    assert.ok(statuses.every((s) => s === "pending"), `${seat} has ${ids.join(", ")}`);
  }
});
