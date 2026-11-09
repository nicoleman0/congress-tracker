// Converts research files (docs/plans/state-roster-research.md) into an import batch for
// scripts/state-offices.ts. States without a research file get in_progress coverage.
// Usage: tsx scripts/roster-import.ts OUTPUT research_notes/roster/*.json
import fs from "node:fs";
import { createHash } from "node:crypto";
import { STATES } from "../lib/states";
import { validateInput } from "./state-offices";

type Cite = { url: string; excerpt: string | null };
type Entry = {
  person: string; office: string; district: string | null; issuer: string; group: string;
  election: { year: number; stage: string }; source: Cite; withdrawn: boolean; outcome: string; result_source: Cite | null;
  current: { status: string; term_start: string | null; term_end: string | null; service_source: Cite | null; contact_url: string | null } | null;
};
type Research = { state: string; researched_at: string; chambers: Record<string, string>; endorsements: Entry[]; coverage: { group: string; status: string; note: string }[] };
type Row = Record<string, unknown>;

const GROUPS = ["wfp", "or", "dsa", "rfs", "pccc", "sunrise"];
const slug = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const short = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 12);

export function convert(files: Research[], today: string) {
  const out = { people: [] as Row[], seats: [] as Row[], sources: [] as Row[], elections: [] as Row[], terms: [] as Row[], issuers: [] as Row[], endorsements: [] as Row[], reconciliations: [] as Row[], coverage: [] as Row[] };
  const seen = new Map<string, Map<string, Row>>();
  // Adds a row once; a second add with the same id must carry the same fields.
  const put = (table: keyof typeof out, row: Row) => {
    const rows = seen.get(table) ?? seen.set(table, new Map()).get(table)!;
    const id = String(row.id), prior = rows.get(id);
    if (prior) { if (JSON.stringify(prior) !== JSON.stringify(row)) throw new Error(`${table} ${id}: conflicting rows ${JSON.stringify(prior)} vs ${JSON.stringify(row)}`); return id; }
    rows.set(id, row); out[table].push(row); return id;
  };
  const source = (c: Cite, checked: string) => put("sources", { id: `src-${short(c.url + "\n" + (c.excerpt ?? ""))}`, url: c.url, label: new URL(c.url).hostname.replace(/^www\./, ""), checked_at: checked, excerpt: c.excerpt });

  // People are keyed by name and state; a name shared across states gets a state suffix.
  const states = new Map<string, Set<string>>();
  for (const f of files) for (const e of f.endorsements) states.set(slug(e.person), (states.get(slug(e.person)) ?? new Set()).add(f.state));
  const personId = (name: string, st: string) => (states.get(slug(name))!.size > 1 ? `${slug(name)}-${st.toLowerCase()}` : slug(name));

  for (const f of files) {
    const st = f.state;
    for (const e of f.endorsements) {
      const person = put("people", { id: personId(e.person, st), name: e.person });
      const chamber = e.office === "governor" ? "Governor" : f.chambers[e.office];
      if (!chamber) throw new Error(`${st} ${e.person}: no chamber for ${e.office}`);
      const seat = put("seats", { id: `${st}-${e.office}${e.district ? `-${slug(e.district)}` : ""}`.toLowerCase(), state: st, office: e.office, chamber, district: e.district });
      const { year, stage } = e.election;
      const cycle = stage === "primary" ? put("elections", { id: `${seat}-${year}-general`, seat_id: seat, year, stage: "general" }) : null;
      const election = put("elections", { id: `${seat}-${year}-${stage}`, seat_id: seat, year, stage, ...(cycle ? { cycle_election_id: cycle } : {}) });
      const issuer = put("issuers", { id: slug(e.issuer), name: e.issuer, group_code: e.group });
      const endorsement = put("endorsements", { id: `end-${short([person, issuer, election, e.source.url].join("|"))}`, person_id: person, issuer_id: issuer, election_id: election, source_id: source(e.source, f.researched_at), withdrawn: e.withdrawn });
      const result = e.result_source ? source(e.result_source, f.researched_at) : null;

      const c = e.current;
      const listed = e.outcome === "won" && c && ["serving", "incoming"].includes(c.status) && c.term_start && c.contact_url;
      let term: string | null = null;
      if (listed && !e.withdrawn) {
        term = put("terms", {
          id: `${person}-${seat}-${year}`, person_id: person, seat_id: seat, election_id: cycle ?? election,
          starts_on: c.term_start, ends_on: c.term_end, status: c.status,
          service_source_id: c.service_source ? source(c.service_source, f.researched_at) : null, result_source_id: result,
          contact_url: c.contact_url, contact_source_id: source({ url: c.contact_url!, excerpt: null }, f.researched_at),
        });
      }
      const reason = term ? "Endorsed for the election that produced this term."
        : e.withdrawn ? "Endorsement withdrawn."
        : e.outcome !== "won" ? `Outcome at research date: ${e.outcome}.`
        : `Won, but current status is ${c?.status ?? "unknown"}${c?.term_start ? "" : " with no term start"}.`;
      put("reconciliations", { id: `rec-${endorsement}`, endorsement_id: endorsement, outcome: term ? "included" : "excluded", reason, term_id: term, evidence_source_id: result });
    }
    for (const g of f.coverage) put("coverage", { id: `${st}:${g.group}`, state: st, group_code: g.group, status: g.status, note: g.note, checked_at: f.researched_at });
  }
  const researched = new Set(files.map((f) => f.state));
  for (const s of STATES) if (s.code !== "DC" && !researched.has(s.code)) for (const g of GROUPS)
    put("coverage", { id: `${s.code}:${g}`, state: s.code, group_code: g, status: "in_progress", note: "Not yet researched.", checked_at: today });
  for (const row of out.coverage) delete row.id;
  validateInput(out);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [output, ...inputs] = process.argv.slice(2);
  if (!output || !inputs.length) throw new Error("usage: tsx scripts/roster-import.ts OUTPUT RESEARCH.json...");
  const batch = convert(inputs.map((p) => JSON.parse(fs.readFileSync(p, "utf8"))), new Date().toISOString().slice(0, 10));
  fs.writeFileSync(output, JSON.stringify(batch, null, 2) + "\n", { flag: "wx" });
  console.log(Object.entries(batch).map(([k, v]) => `${k} ${v.length}`).join(" · "));
}
