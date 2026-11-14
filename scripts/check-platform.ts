// Rechecks campaign and office stances against their source pages. A stance whose quote is still on the
// page gets the current checkedAt. Drifted or unreachable sources keep their old date and are reported.
// Usage: tsx scripts/check-platform.ts [report.md]
import fs from "node:fs";
import type { Stance } from "@/lib/data";
import { checkedNow } from "@/lib/freshness";

const PLATFORM = "data/platform.json";
// Some campaign sites refuse non-browser agents.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

// Tags, entities, JSON escapes, curly quotes and punctuation all vary between renders; compare words only.
// Escapes are decoded before tags are stripped because some sites ship their text as escaped JSON.
export function normalize(s: string) {
  return s
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&[rl]squo;|&apos;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .toLowerCase()
    .replace(/['’‘]/g, "")
    .replace(/[^a-z0-9$%]+/g, " ")
    .trim();
}

export type Result = "confirmed" | "drifted" | "unreachable";

export function judge(page: string | null, quote: string): Result {
  if (page === null) return "unreachable";
  return normalize(page).includes(normalize(quote)) ? "confirmed" : "drifted";
}

export type Fetched = { page: string | null; why?: string };

// Why a response can't be read. A dead page needs a data fix; a bot check or a dropped request does not.
export function failure(status: number, headers: Headers): string {
  return headers.get("cf-mitigated") === "challenge" ? `bot check, HTTP ${status}` : `HTTP ${status}`;
}

// One retry: campaign hosts drop the odd request, and a single miss shouldn't read as drift.
export async function fetchSource(url: string): Promise<Fetched> {
  let why = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": BROWSER_UA }, signal: AbortSignal.timeout(20_000) });
      if (res.ok) return { page: await res.text() };
      why = failure(res.status, res.headers);
    } catch (e) {
      why = e instanceof Error && e.name === "TimeoutError" ? "timed out" : "no response";
    }
    await new Promise((r) => setTimeout(r, 3_000));
  }
  return { page: null, why };
}

export const fetchPage = async (url: string) => (await fetchSource(url)).page;

async function main() {
  const out = process.argv[2];
  const data = JSON.parse(fs.readFileSync(PLATFORM, "utf8")) as { stances: Record<string, Stance[]> };
  const now = checkedNow();
  const checked = Object.entries(data.stances).flatMap(([id, list]) =>
    list.filter((s) => s.kind !== "congress").map((s) => ({ id, s })),
  );
  const missing = checked.filter(({ s }) => !s.quote);
  if (missing.length) throw new Error(`stances without a quote: ${missing.map(({ id, s }) => `${id}/${s.issue}`).join(", ")}`);

  const urls = [...new Set(checked.map(({ s }) => s.source.url))];
  const pages = new Map<string, Fetched>();
  for (let i = 0; i < urls.length; i += 6) {
    const batch = urls.slice(i, i + 6);
    (await Promise.all(batch.map(fetchSource))).forEach((p, j) => pages.set(batch[j], p));
  }

  const problems: Record<Exclude<Result, "confirmed">, string[]> = { drifted: [], unreachable: [] };
  let confirmed = 0;
  for (const { id, s } of checked) {
    const { page, why } = pages.get(s.source.url)!;
    const r = judge(page, s.quote!);
    if (r === "confirmed") { s.checkedAt = now; confirmed++; }
    else problems[r].push(`- ${id} (${s.issue}): ${s.source.url} — ${why ? `${why}, ` : ""}last confirmed ${s.checkedAt}`);
  }
  fs.writeFileSync(PLATFORM, JSON.stringify(data, null, 2) + "\n");

  const report = [
    `Rechecked ${checked.length} platform stances against ${urls.length} source pages: ${confirmed} confirmed.`,
    "", `### Quote no longer on the page (${problems.drifted.length})`, ...problems.drifted,
    "", `### Source unreachable (${problems.unreachable.length})`, ...problems.unreachable,
  ].join("\n");
  if (out) fs.writeFileSync(out, report + "\n");
  console.log(report);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
