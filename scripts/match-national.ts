// Matches saved national endorsement lists (WFP 2026, DSA tables, RFS cards) to Open States' current legislators.
// A seated match is service evidence; whether the endorsement covers the current term is decided in review.
// Usage: tsx scripts/match-national.ts   -> research_notes/national/matches.tsv
import fs from "node:fs";
import { bare } from "@/lib/names";
import { STATES } from "@/lib/states";

const GAP = "research_notes/State endorsement gap review";
const OUT = "research_notes/national/matches.tsv";
type Lead = { group: string; year: string; state: string; name: string; office: string; source: string };
type Member = { name: string; chamber: string; district: string; link: string };

function tsv(path: string): Record<string, string>[] {
  const lines = fs.readFileSync(path, "utf8").split("\n").filter((l) => l && !l.startsWith("#"));
  const head = lines[0].split("\t");
  return lines.slice(1).map((l) => Object.fromEntries(l.split("\t").map((v, i) => [head[i], v])));
}
function csv(path: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (const ch of fs.readFileSync(path, "utf8")) {
    if (quoted) { if (ch === '"') quoted = false; else cell += ch; continue; }
    if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  const [head, ...body] = rows;
  return body.filter((r) => r.length === head.length).map((r) => Object.fromEntries(r.map((v, i) => [head[i], v])));
}

const stateBySlug = new Map(STATES.map((s) => [s.name.toLowerCase().replace(/ /g, "-"), s.code]));
// Chamber and district from free text like "Arizona State House, Legislative District 5" or "16th Middlesex District".
export function seat(office: string): { chamber: string; district: string } | null {
  if (/^governor$/i.test(office.trim())) return { chamber: "governor", district: "" };
  const chamber = /senat/i.test(office) ? "upper" : /house|assembly|representative|delegate/i.test(office) ? "lower" : /legislature/i.test(office) ? "legislature" : null;
  if (!chamber) return null;
  const district =
    office.match(/(\d+)(?:st|nd|rd|th)?\s+legislative district/i)?.[1] ??
    office.match(/[A-Z]{2}-(\d+)(?:st|nd|rd|th)/)?.[1] ??
    office.match(/(\d+(?:st|nd|rd|th)\s+[A-Za-z&. -]+?)\s+District/i)?.[1] ??
    office.match(/District\s+(\d+(?:st|nd|rd|th)\s+[A-Za-z&. -]+?)\s*(,|$)/i)?.[1] ??
    office.match(/district\s*#?\s*([0-9]+[A-Z]?)/i)?.[1] ??
    office.match(/,\s*([A-Za-z]+ \d+)\s*,/)?.[1] ?? "";
  return { chamber, district: district.trim() };
}
const norm = (s: string) => bare(s.replace(/\b(rep|sen|del|dr|jr|sr|ii|iii)\.?(?=\s|$)/gi, "")).replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
const last = (s: string) => norm(s).split(" ").at(-1) ?? "";

function leads(): Lead[] {
  const out: Lead[] = [];
  for (const r of tsv("research_notes/national/wfp-2026-candidates.tsv"))
    out.push({ group: "wfp", year: "2026", state: stateBySlug.get(r.state) ?? "", name: r.name, office: r.office, source: "https://workingfamilies.org/candidates/" });
  for (const f of ["dsa_sunrise_dsa_current_state_sources.json", "dsa_sunrise_dsa_past_state_sources.json"]) {
    const d = JSON.parse(fs.readFileSync(`${GAP}/${f}`, "utf8"));
    for (const r of d.records) if (r.in_scope) out.push({ group: "dsa", year: (r.election_date?.match(/\d{4}/) ?? [""])[0], state: r.state, name: r.name, office: r.office, source: d.source_url });
  }
  for (const r of tsv(`${GAP}/rfs_pccc_directory_cards.tsv`))
    if (r.in_scope === "True" && Number(r.directory_year) >= 2022) out.push({ group: "rfs", year: r.directory_year, state: r.state, name: r.name, office: r.office, source: r.profile_url });
  return out.filter((l) => l.state && l.state !== "DC");
}

function main() {
  const rosters = new Map<string, Member[]>();
  const roster = (st: string) => {
    if (!rosters.has(st)) rosters.set(st, csv(`research_notes/openstates/${st}.csv`).map((m) => ({ name: m.name, chamber: m.current_chamber, district: m.current_district, link: m.links.split(";")[0] })));
    return rosters.get(st)!;
  };
  const lines = ["group\tyear\tstate\tname\toffice\tmatch\tseated_name\tseated_chamber\tseated_district\tcontact_url\tsource"];
  const tally: Record<string, number> = {};
  for (const l of leads()) {
    const s = seat(l.office);
    let match = "no_seat_parsed", m: Member | undefined;
    if (s?.chamber === "governor") match = "governor";
    else if (s) {
      const sameSeat = roster(l.state).filter((x) => (x.chamber === s.chamber || x.chamber === "legislature") && (!s.district || norm(x.district) === norm(s.district)));
      m = sameSeat.find((x) => last(x.name) === last(l.name));
      match = m ? (s.district ? "seated" : "seated_name_only") : sameSeat.length ? "other_holder" : "seat_not_found";
    }
    tally[match] = (tally[match] ?? 0) + 1;
    lines.push([l.group, l.year, l.state, l.name, l.office, match, m?.name ?? "", m?.chamber ?? "", m?.district ?? "", m?.link ?? "", l.source].join("\t"));
  }
  fs.writeFileSync(OUT, lines.join("\n") + "\n");
  console.log(Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(" · "));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
