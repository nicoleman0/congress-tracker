// Fills in campaign sites from each member's principal FEC committee (the website on its Form 1).
// Only writes links that load. Anything ambiguous or unreachable is reported for a manual check.
// Usage: FEC_API_KEY=... tsx scripts/campaign-links.ts [--all]
import fs from "node:fs";
import type { Member } from "@/lib/data";
import { bare } from "@/lib/names";
import { USER_AGENT } from "@/lib/site";

const DATA = "data/members.json";
const FEC = "https://api.open.fec.gov/v1";

export type FecCandidate = {
  candidate_id: string;
  name: string; // "LAST, FIRST MIDDLE"
  district: string; // "07", "00" for at-large and Senate
  principal_committees: { committee_id: string; cycles: number[] }[];
};

// Last name must match ours; first name by initial, or exactly when FEC lists a nickname ("HENRY C. HANK").
export function sameName(m: Member, fecName: string) {
  const [last, first = ""] = fecName.split(",");
  const ours = bare(m.name);
  const firsts = bare(first).split(" ");
  return ours.endsWith(" " + bare(last)) && (firsts[0][0] === ours[0] || firsts.includes(ours.split(" ")[0]));
}

export function pickCandidate(m: Member, results: FecCandidate[]): FecCandidate | string {
  const district = m.office === "senate" ? "00" : m.district === "AL" ? "00" : m.district!.padStart(2, "0");
  const hits = results.filter((c) => c.district === district && sameName(m, c.name));
  if (hits.length !== 1) return `${hits.length} FEC candidates match (${results.map((c) => c.name).join("; ") || "none returned"})`;
  return hits[0];
}

// Form 1 sites are free text like "WWW.KIROSFORCO.COM". Hosts are case-insensitive; paths are not, so leave them.
export function normalizeSite(raw: string | null): string | null {
  const s = raw?.trim();
  if (!s) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  url.protocol = "https:";
  if (url.hostname.endsWith(".gov")) return null; // Official office site, not the campaign.
  return url.toString().replace(/\/$/, "");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Keys allow 60 requests per rolling window: pace at one per second and wait out a 429.
async function fec(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ ...params, api_key: process.env.FEC_API_KEY! });
  for (let attempt = 0; attempt < 5; attempt++) {
    await sleep(1100);
    const res = await fetch(`${FEC}${path}?${qs}`);
    if (res.status === 429) { await sleep(60_000); continue; }
    if (!res.ok) throw new Error(`FEC ${path}: HTTP ${res.status}`);
    return (await res.json()).results;
  }
  throw new Error(`FEC ${path}: still rate limited after 5 tries`);
}

async function loads(url: string) {
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "user-agent": USER_AGENT } });
    // A Cloudflare bot challenge means the site is up; visitors pass it, scripts don't.
    if (res.ok || res.headers.get("cf-mitigated") === "challenge") return null;
    return `HTTP ${res.status}`;
  } catch (e) {
    return (e as Error).message;
  }
}

async function main() {
  if (!process.env.FEC_API_KEY) throw new Error("set FEC_API_KEY (free at https://api.data.gov/signup/)");
  const all = process.argv.includes("--all");
  const data = JSON.parse(fs.readFileSync(DATA, "utf8")) as { members: Member[] };
  const added: string[] = [];
  const problems: string[] = [];

  for (const m of data.members.filter((x) => all || !x.campaign)) {
    const last = bare(m.name).split(" ").at(-1)!;
    const results: FecCandidate[] = await fec("/candidates/search/", {
      q: last, state: m.state, office: m.office === "senate" ? "S" : "H", per_page: "50",
    });
    const pick = pickCandidate(m, results);
    if (typeof pick === "string") { problems.push(`${m.id}: ${pick}`); continue; }

    const committee = [...pick.principal_committees].sort((a, b) => Math.max(...b.cycles) - Math.max(...a.cycles))[0];
    if (!committee) { problems.push(`${m.id}: ${pick.candidate_id} has no principal committee`); continue; }
    const [detail] = await fec(`/committee/${committee.committee_id}/`, {});
    const url = normalizeSite(detail?.website ?? null);
    if (!url) { problems.push(`${m.id}: ${committee.committee_id} lists no usable website (${detail?.website ?? "none"})`); continue; }
    const err = await loads(url);
    if (err) { problems.push(`${m.id}: ${url} did not load (${err}); FEC ${committee.committee_id}`); continue; }

    m.campaign = { url, fec: committee.committee_id };
    added.push(`${m.name}: ${url}`);
  }

  fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + "\n");
  console.log([
    `### Added (${added.length})`, ...added.map((a) => `- ${a}`),
    "", `### Needs a manual check (${problems.length})`, ...problems.map((p) => `- ${p}`),
  ].join("\n"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
