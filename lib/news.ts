// Recent headlines about a member from Google News search RSS. Pure helpers; fetching and caching
// live in components/MemberNews.tsx.
import type { Member } from "@/lib/data";
import { bare, SUFFIX } from "@/lib/names";

export type Headline = { title: string; url: string; source: string; date: string };

// Middle initials and suffixes make the exact-phrase match miss most coverage.
export function searchName(m: Member) {
  return m.name.replace(SUFFIX, "").replace(/,?\s*$/, "").split(" ").filter((w) => !/^[A-Z]\.$/.test(w)).join(" ");
}

// Context words keep out namesakes (boxers, economists) without requiring "Congress", which hid most coverage.
// The headline filter in aboutMember drops roundups these words pull in.
export function newsUrl(m: Member, place: string) {
  const context = m.office === "senate"
    ? ["Senate", "Sen", "Senator", "Congress", "Democrat", `"${place}"`]
    : ["Congress", "Rep", "Congressman", "Congresswoman", "House", "Democrat", `"${place}"`];
  const q = `"${searchName(m)}" (${context.join(" OR ")}) when:90d`;
  return `https://news.google.com/rss/search?${new URLSearchParams({ q, hl: "en-US", gl: "US", ceid: "US:en" })}`;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(\w+);/g, (e, n) => ENTITIES[n] ?? e)
    .trim();
const tag = (item: string, name: string) => decode(item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? "");

export function parseRss(xml: string): Headline[] {
  if (!/<rss[\s>]/.test(xml)) throw new Error("response is not an RSS feed");
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
    const source = tag(item, "source");
    const title = tag(item, "title");
    // Google appends " - Source" to every title.
    const suffix = ` - ${source}`;
    return {
      title: source && title.endsWith(suffix) ? title.slice(0, -suffix.length) : title,
      url: tag(item, "link"),
      source,
      date: new Date(tag(item, "pubDate")).toISOString(),
    };
  });
}

// Roundups that mention a member in passing rarely name them in the headline, so require the last name there.
export function aboutMember(m: Member, items: Headline[]): Headline[] {
  const last = bare(m.name.replace(SUFFIX, "")).split(" ").at(-1)!;
  const seen = new Set<string>();
  return items
    .filter((h) => h.url.startsWith("https://") && ` ${bare(h.title)} `.includes(` ${last} `))
    .filter((h) => !seen.has(bare(h.title)) && seen.add(bare(h.title)))
    .sort((a, b) => b.date.localeCompare(a.date));
}
