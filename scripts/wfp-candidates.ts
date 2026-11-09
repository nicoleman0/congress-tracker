// Saves WFP's national 2026 candidate list, including rows hidden behind "View More", as research evidence.
// Keeps governor and state legislative rows only. The page is undated and can change, so the file records the fetch time.
// Usage: tsx scripts/wfp-candidates.ts
import fs from "node:fs";

const PAGE = "https://workingfamilies.org/candidates/";
const AJAX = "https://workingfamilies.org/wp-admin/admin-ajax.php";
const OUT = "research_notes/national/wfp-2026-candidates.tsv";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
const IN_SCOPE = /^(governor$|.*\b(state (house|senate|assembly|representative)|sate assembly|house of (representatives|delegates)|state senate)\b)/i;
const OUT_OF_SCOPE = /lieutenant|county|city|u\.s\./i;

const decode = (s: string) => s.replace(/&#8217;|&rsquo;/g, "’").replace(/&#8220;|&#8221;/g, '"').replace(/&amp;/g, "&").replace(/&#039;/g, "'").replace(/\s+/g, " ").trim();
const rowsIn = (html: string) =>
  [...html.matchAll(/state-cands__name">([\s\S]*?)<\/td>\s*<td class="state-cands__info">([\s\S]*?)<\/td>/g)].map((m) => ({ name: decode(m[1]), office: decode(m[2]) }));

async function get(url: string, body?: string) {
  const res = await fetch(url, {
    method: body ? "POST" : "GET", body,
    headers: { "user-agent": UA, ...(body ? { "content-type": "application/x-www-form-urlencoded" } : {}) },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

async function main() {
  const page = await get(PAGE);
  const sections = page.split(/nlist__item--state nlist__item--/).slice(1);
  if (!sections.length) throw new Error("no state sections found; page layout changed");
  const lines: string[] = [];
  for (const section of sections) {
    const state = section.match(/^([a-z-]+)/)![1];
    const id = section.match(/data-state-id="(\d+)"/)?.[1];
    // The POST returns the whole state list, so it replaces the first rows shown on the page.
    const rows = id ? rowsIn(await get(AJAX, `action=more_candidates&state=${id}`)) : rowsIn(section);
    const seen = new Set<string>();
    for (const r of rows) {
      if (!IN_SCOPE.test(r.office) || OUT_OF_SCOPE.test(r.office) || seen.has(r.name + r.office)) continue;
      seen.add(r.name + r.office);
      lines.push([state, r.name, r.office].join("\t"));
    }
  }
  fs.mkdirSync("research_notes/national", { recursive: true });
  const header = `# ${PAGE} (fetched ${new Date().toISOString()}; hidden rows via ${AJAX} action=more_candidates)\nstate\tname\toffice`;
  fs.writeFileSync(OUT, `${header}\n${lines.join("\n")}\n`);
  console.log(`${lines.length} rows across ${new Set(lines.map((l) => l.split("\t")[0])).size} states`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
