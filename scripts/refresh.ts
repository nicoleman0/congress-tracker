// Rechecks unresolved races against NBC News race pages and updates data/members.json.
// Reads the structured race data NBC embeds in each page. Prints a markdown report for the PR body.
// Usage: tsx scripts/refresh.ts [report-path]
import fs from "node:fs";
import type { Member, Status } from "@/lib/data";
import { checkedNow } from "@/lib/freshness";
import { bare } from "@/lib/names";
import { USER_AGENT } from "@/lib/site";
import { STATES } from "@/lib/states";

const DATA = "data/members.json";
const NBC = "https://www.nbcnews.com/politics/2026-elections";
const RECHECK: Status[] = ["leading", "pending", "incumbent"];

type Candidate = { name: string; lastName?: string; isWinner: boolean; percentVote: number };
export type Race = { officeCode: string; callStatusCode: string; percentIn: number; candidates: Candidate[] };
export type Decision = { status: Status; note: string } | { error: string };

export function nbcUrl(m: Member): string | null {
  const state = STATES.find((s) => s.code === m.state)!;
  if (!state.senators) return null; // NBC has no DC delegate page.
  const slug = state.name.toLowerCase().replace(/ /g, "-");
  if (m.office === "senate") return `${NBC}/${slug}-senate-results`;
  return `${NBC}/${slug}-us-house-district-${m.district === "AL" ? 1 : m.district}-results`;
}

export function parseRaces(html: string): Race[] {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("no __NEXT_DATA__ on page");
  const races = JSON.parse(m[1])?.props?.pageProps?.races;
  if (!Array.isArray(races)) throw new Error("no races in page data");
  return races.map((r: { summary: Race }) => r.summary);
}

// Same first initial, and our full name ends with their last name (handles "Avila Chevalier").
function matches(m: Member, c: Candidate) {
  const ours = bare(m.name);
  const last = bare(c.lastName ?? c.name.split(" ").at(-1)!);
  return ours.endsWith(" " + last) && bare(c.name)[0] === ours[0];
}

export function decide(m: Member, races: Race[]): Decision {
  const office = m.office === "senate" ? "S" : "H";
  const race = races.find((r) => r.officeCode === office && r.candidates.some((c) => matches(m, c)));
  if (!race) return { error: `${m.name} not found among candidates on the race page` };
  const me = race.candidates.find((c) => matches(m, c))!;
  const ranked = [...race.candidates].sort((a, b) => b.percentVote - a.percentVote);
  const rival = ranked.find((c) => c !== me);
  const winner = race.candidates.find((c) => c.isWinner);
  // Called races state the result. Vote shares are left out: they're a mid-count snapshot that is never rechecked.
  if (race.callStatusCode && winner) {
    if (winner !== me) return { status: "lost", note: `Lost to ${winner.name}.` };
    return { status: "won", note: rival ? `Beat ${rival.name}.` : "Ran unopposed." };
  }
  if (!rival) return { status: "leading", note: "Unopposed, not yet called." };
  const tally = `${me.percentVote}% to ${rival.percentVote}%, with ${race.percentIn}% of the vote counted.`;
  return ranked[0] === me
    ? { status: "leading", note: `Leads ${rival.name}, ${tally}` }
    : { status: "pending", note: `Trails ${rival.name}, ${tally}` };
}

async function main() {
  const reportPath = process.argv[2];
  const data = JSON.parse(fs.readFileSync(DATA, "utf8")) as { members: Member[] };
  const now = checkedNow();
  const changes: string[] = [];
  const problems: string[] = [];
  let checked = 0;
  let fetched = 0;
  let broken = 0;

  // Senators not up in 2026 have no race page.
  for (const m of data.members.filter((x) => RECHECK.includes(x.status) && !(x.office === "senate" && x.incumbent))) {
    const url = nbcUrl(m);
    if (!url) { problems.push(`${m.id}: no NBC page for this seat; check by hand`); continue; }
    let decision: Decision;
    try {
      const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const races = parseRaces(await res.text());
      fetched++;
      decision = decide(m, races);
    } catch (e) {
      broken++;
      decision = { error: `${url}: ${(e as Error).message}` };
    }
    await new Promise((r) => setTimeout(r, 300));
    if ("error" in decision) { problems.push(`${m.id}: ${decision.error}`); continue; }

    checked++;
    if (decision.status !== m.status) changes.push(`${m.name} (${m.id}): ${m.status} → **${decision.status}**. ${decision.note}`);
    Object.assign(m, { status: decision.status, note: decision.note, checkedAt: now, source: { label: "NBC News", url } });
  }

  // Most pages failing to load or parse means NBC changed its site; don't write half-updated data.
  if (broken > fetched) {
    console.error(problems.join("\n"));
    throw new Error(`${broken} of ${fetched + broken} pages failed to load or parse; refusing to write data`);
  }
  fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + "\n");

  const report = [
    `Checked ${checked} races against NBC News on ${now}.`,
    "", `### Status changes (${changes.length})`, ...(changes.length ? changes.map((c) => `- ${c}`) : ["None."]),
    "", `### Needs a manual check (${problems.length})`, ...(problems.length ? problems.map((p) => `- ${p}`) : ["None."]),
  ].join("\n");
  if (reportPath) fs.writeFileSync(reportPath, report + "\n");
  console.log(report);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
