// Checks a state research file (docs/plans/state-roster-research.md) before review:
// shape, then every excerpt against its live page. Exits nonzero on any problem.
// Usage: tsx scripts/verify-roster.ts research_notes/roster/DE.json [...more]
import fs from "node:fs";
import { STATES } from "@/lib/states";
import { fetchPage, judge } from "./check-platform";

const GROUPS = ["wfp", "or", "dsa", "rfs", "pccc", "sunrise"];
const OFFICES = ["governor", "upper", "lower", "unicameral"];
const STAGES = ["general", "primary", "special"];
const OUTCOMES = ["won", "lost", "pending", "withdrew", "unknown"];
const CURRENT = ["serving", "incoming", "not_serving", "unknown"];
const COVERAGE = ["complete_with_entries", "complete_no_entries", "blocked"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

type Cite = { url: string; excerpt: string | null };
type Entry = {
  person: string; office: string; district: string | null; issuer: string; group: string; issuer_source: string | null;
  election: { year: number; stage: string }; source: Cite; withdrawn: boolean; outcome: string; result_source: Cite | null;
  current: { status: string; term_start: string | null; term_end: string | null; service_source: Cite | null; contact_url: string | null } | null;
  notes: string;
};
type Research = { state: string; researched_at: string; chambers: Record<string, string>; endorsements: Entry[]; coverage: { group: string; status: string; checked: string[]; note: string }[]; gaps: string[] };

export function shapeProblems(r: Research, today = new Date().toISOString().slice(0, 10)): string[] {
  const p: string[] = [];
  const add = (cond: unknown, msg: string) => { if (cond) p.push(msg); };
  const cite = (c: Cite | null | undefined, where: string, required: boolean) => {
    if (!c) return add(required, `${where}: source required`);
    add(!/^https:\/\//.test(c.url), `${where}: url must be https`);
    add(c.excerpt !== null && typeof c.excerpt !== "string", `${where}: excerpt must be text or null`);
  };
  add(!STATES.some((s) => s.code === r.state && s.code !== "DC"), `unknown state ${r.state}`);
  add(!DATE.test(r.researched_at), "researched_at must be YYYY-MM-DD");
  r.endorsements.forEach((e, i) => {
    const at = `#${i} ${e.person}`;
    add(!e.person?.trim(), `${at}: person required`);
    add(!OFFICES.includes(e.office), `${at}: bad office ${e.office}`);
    add((e.office === "governor") !== (e.district === null), `${at}: district must be null only for governor`);
    add(!GROUPS.includes(e.group), `${at}: bad group ${e.group}`);
    add(e.group === "rfs" && e.office === "governor", `${at}: RFS does not endorse governors`);
    add(!e.issuer?.trim(), `${at}: issuer required`);
    add(!Number.isInteger(e.election?.year) || e.election.year < 2022 || e.election.year > 2026, `${at}: election year out of scope`);
    add(!STAGES.includes(e.election?.stage), `${at}: bad stage`);
    add(typeof e.withdrawn !== "boolean", `${at}: withdrawn must be boolean`);
    add(!OUTCOMES.includes(e.outcome), `${at}: bad outcome ${e.outcome}`);
    cite(e.source, `${at} endorsement`, true);
    cite(e.result_source, `${at} result`, ["won", "lost"].includes(e.outcome));
    if (e.outcome !== "won") return add(e.current !== null, `${at}: current must be null unless won`);
    if (!e.current) return add(true, `${at}: current required when won`);
    add(!CURRENT.includes(e.current.status), `${at}: bad current status`);
    add(e.current.term_start !== null && !DATE.test(e.current.term_start), `${at}: term_start must be YYYY-MM-DD`);
    add(e.current.term_end !== null && !DATE.test(e.current.term_end), `${at}: term_end must be YYYY-MM-DD`);
    cite(e.current.service_source, `${at} service`, e.current.status === "serving");
    const { term_start: start, term_end: end } = e.current;
    const expected = end && end <= today ? "not_serving" : start && start <= today ? "serving" : start ? "incoming" : null;
    add(expected && e.current.status !== "unknown" && e.current.status !== expected, `${at}: status ${e.current.status} contradicts term ${start} to ${end}`);
    add(e.current.contact_url !== null && !/^https:\/\//.test(e.current.contact_url ?? ""), `${at}: contact_url must be https`);
    add(["serving", "incoming"].includes(e.current.status) && !e.current.contact_url, `${at}: contact_url required for a listed term`);
  });
  const groups = r.coverage.map((c) => c.group).sort();
  add(groups.join() !== [...GROUPS].sort().join(), "coverage needs exactly one row per group");
  for (const c of r.coverage) {
    add(!COVERAGE.includes(c.status), `coverage ${c.group}: bad status`);
    add(!c.note?.trim(), `coverage ${c.group}: note required`);
    const has = r.endorsements.some((e) => e.group === c.group);
    add(c.status === "complete_with_entries" && !has, `coverage ${c.group}: claims entries but none listed`);
    add(c.status === "complete_no_entries" && has, `coverage ${c.group}: claims none but entries listed`);
  }
  return p;
}

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) throw new Error("usage: verify-roster FILE...");
  let failed = false;
  for (const file of files) {
    const r = JSON.parse(fs.readFileSync(file, "utf8")) as Research;
    const shape = shapeProblems(r);
    const cites = r.endorsements.flatMap((e) => [
      { who: e.person, kind: "endorsement", c: e.source },
      { who: e.person, kind: "result", c: e.result_source },
      { who: e.person, kind: "service", c: e.current?.service_source ?? null },
    ]).filter((x): x is { who: string; kind: string; c: Cite } => !!x.c);
    const pages = new Map<string, string | null>();
    for (const url of new Set(cites.filter((x) => x.c.excerpt).map((x) => x.c.url))) pages.set(url, await fetchPage(url));
    const results = cites.map((x) => ({ ...x, result: x.c.excerpt ? judge(pages.get(x.c.url) ?? null, x.c.excerpt) : "no excerpt" }));
    const count = (r: string) => results.filter((x) => x.result === r).length;
    console.log(`\n${file}: ${r.endorsements.length} endorsements, ${cites.length} citations`);
    console.log(`  confirmed ${count("confirmed")} · drifted ${count("drifted")} · unreachable ${count("unreachable")} · no excerpt ${count("no excerpt")}`);
    for (const s of shape) console.log(`  SHAPE ${s}`);
    for (const x of results.filter((x) => x.result !== "confirmed")) console.log(`  ${x.result.toUpperCase()} ${x.who} (${x.kind}): ${x.c.url}`);
    if (shape.length || count("drifted")) failed = true;
  }
  if (failed) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
