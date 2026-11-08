import assert from "node:assert/strict";
import { test } from "node:test";
import { searchEntries } from "@/lib/data";
import { searchMembers } from "@/lib/search";

const find = (q: string) => searchMembers(searchEntries(), q, 200).map((e) => e.id);

test("finds by last name", () => {
  assert.equal(find("Kiros")[0], "co-01-kiros");
});

test("ignores accents and hyphens", () => {
  assert.ok(find("Barragan").some((id) => id.includes("barragan")));
  assert.ok(find("Ocasio Cortez").some((id) => id.includes("ocasio")));
  assert.ok(find("ocasiocortez").some((id) => id.includes("ocasio")));
});

test("seat matches put the exact district first", () => {
  assert.equal(find("CO-1")[0], "co-01-kiros");
  assert.equal(find("co 1")[0], "co-01-kiros");
});

test("state name matches every member there", () => {
  const ids = find("Colorado");
  assert.ok(ids.length > 0);
  assert.ok(ids.every((id) => id.startsWith("co-")));
});

test("blank or unmatched queries return nothing", () => {
  assert.deepEqual(find("  "), []);
  assert.deepEqual(find("zzzz"), []);
});
