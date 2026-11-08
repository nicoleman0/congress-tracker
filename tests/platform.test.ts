import assert from "node:assert/strict";
import { test } from "node:test";
import { isStale } from "@/lib/freshness";
import { judge, normalize } from "../scripts/check-platform";

test("quotes match across markup, entities, escaped JSON and curly apostrophes", () => {
  const quote = "Brad will co-sponsor the Block the Bombs Act";
  assert.equal(judge("<p>Brad will <a href=x>co-sponsor the &ldquo;Block the Bombs Act</a>&rdquo;</p>", quote), "confirmed");
  assert.equal(judge('"Brad will \\u003cstrong\\u003eco-sponsor the \\u201cBlock the Bombs Act', quote), "confirmed");
  assert.equal(normalize("Sherman&rsquo;s bill"), normalize("Sherman’s bill"));
});

test("a missing quote is drift and a missing page is unreachable", () => {
  assert.equal(judge("<p>Brad supports a ceasefire.</p>", "Block the Bombs Act"), "drifted");
  assert.equal(judge(null, "anything"), "unreachable");
});

test("stances go stale 60 days after their last check", () => {
  assert.equal(isStale("2026-11-08", new Date("2027-01-06T12:00:00Z")), false);
  assert.equal(isStale("2026-11-08", new Date("2027-01-08T12:00:00Z")), true);
});
