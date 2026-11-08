import assert from "node:assert/strict";
import { test } from "node:test";
import type { Member } from "@/lib/data";
import { aboutMember, newsUrl, parseRss, searchName, type Headline } from "@/lib/news";

const member = (o: Partial<Member>): Member => ({
  id: "x", name: "Melat Kiros", office: "house", incumbent: false, state: "CO", district: "1",
  endorsedBy: ["WFP"], status: "won", note: "", source: { label: "", url: "https://x" }, checkedAt: "2026-11-08", ...o,
});
const h = (title: string, date = "2026-11-05T00:00:00.000Z"): Headline => ({ title, url: `https://n/${title}`, source: "S", date });

test("searchName drops middle initials and suffixes", () => {
  assert.equal(searchName(member({ name: "Justin J. Pearson" })), "Justin Pearson");
  assert.equal(searchName(member({ name: "Frederick Haynes III" })), "Frederick Haynes");
  assert.equal(searchName(member({ name: "Robert White Jr." })), "Robert White");
});

test("newsUrl adds office and place context over 90 days", () => {
  const q = (m: Member, place: string) => new URL(newsUrl(m, place)).searchParams.get("q")!;
  assert.equal(q(member({}), "Colorado"), '"Melat Kiros" (Congress OR Rep OR Congressman OR Congresswoman OR House OR Democrat OR "Colorado") when:90d');
  assert.match(q(member({ name: "Troy Jackson", office: "senate", district: null }), "Maine"), /^"Troy Jackson" \(Senate OR Sen OR .* OR "Maine"\) when:90d$/);
});

test("parseRss strips the source suffix and decodes entities", () => {
  const xml = `<rss version="2.0"><channel><item><title>Kiros &amp; the &#39;mandate&#39; - The Denver Post</title>
    <link>https://news.google.com/a</link><pubDate>Fri, 06 Nov 2026 22:41:11 GMT</pubDate>
    <source url="https://www.denverpost.com">The Denver Post</source></item></channel></rss>`;
  assert.deepEqual(parseRss(xml), [
    { title: "Kiros & the 'mandate'", url: "https://news.google.com/a", source: "The Denver Post", date: "2026-11-06T22:41:11.000Z" },
  ]);
  assert.throws(() => parseRss("<html>blocked</html>"), /not an RSS feed/);
});

test("aboutMember keeps headlines naming them, newest first, deduped", () => {
  const items = [h("Kiros wins", "2026-11-04T00:00:00.000Z"), h("House roundup"), h("Kirosville fair"), h("KIROS WINS"), h("Rep. Kiros on Medicare", "2026-11-07T00:00:00.000Z")];
  assert.deepEqual(aboutMember(member({}), items).map((x) => x.title), ["Rep. Kiros on Medicare", "Kiros wins"]);
  const aoc = member({ name: "Alexandria Ocasio-Cortez" });
  assert.equal(aboutMember(aoc, [h("Ocasio-Cortez says")]).length, 1);
  const barragan = member({ name: "Nanette Barragán" });
  assert.equal(aboutMember(barragan, [h("Barragan backs bill")]).length, 1);
});
