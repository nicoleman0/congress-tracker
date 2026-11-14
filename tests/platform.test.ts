import assert from "node:assert/strict";
import { test } from "node:test";
import { isStale } from "@/lib/freshness";
import { failure, judge, normalize } from "../scripts/check-platform";

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

test("a failed fetch says whether the page is gone or a bot check refused it", () => {
  assert.equal(failure(404, new Headers()), "HTTP 404");
  assert.equal(failure(403, new Headers({ "cf-mitigated": "challenge" })), "bot check, HTTP 403");
});

test("stances go stale 60 days after their last check", () => {
  assert.equal(isStale("2026-11-08", new Date("2027-01-06T12:00:00Z")), false);
  assert.equal(isStale("2026-11-08", new Date("2027-01-08T12:00:00Z")), true);
});
