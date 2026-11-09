// Drafts research files (docs/plans/state-roster-research.md) for unresearched states from the
// national lists alone: matches.tsv, term-rules/*.json and cycle-check.tsv. Coverage is always
// blocked, since chapter pages, earlier WFP cycles, OR, PCCC and Sunrise are not checked.
// Usage: tsx scripts/roster-seed.ts TODAY ST...   -> research_notes/roster/<ST>.json (never overwrites)
import fs from "node:fs";
import { STATES } from "@/lib/states";
import { seat } from "./match-national";

const NAT = "research_notes/national";
const GAP = "research_notes/State endorsement gap review";
type Cite = { url: string; excerpt: string | null };
type Election = { year: number; seats: string; term_years: number | null; term_start: string | null; term_end: string | null };
type Rule = { chamber: string; source: Cite | null; elections: Election[]; start_rule: string };
type StateRules = { state: string; chambers: Record<string, string>; rules: Rule[] };

function tsv(path: string): Record<string, string>[] {
  const lines = fs.readFileSync(path, "utf8").split("\n").filter((l) => l && !l.startsWith("#"));
  const head = lines[0].split("\t");
  return lines.slice(1).map((l) => Object.fromEntries(l.split("\t").map((v, i) => [head[i], v])));
}
const openStates = (st: string): Cite => ({ url: `https://data.openstates.org/people/current/${st.toLowerCase()}.csv`, excerpt: null });
const status = (start: string, end: string | null, today: string) => (start > today ? "incoming" : end && end <= today ? "not_serving" : "serving");

export function seed(st: string, today: string) {
  const name = STATES.find((s) => s.code === st)?.name;
  if (!name) throw new Error(`unknown state ${st}`);
  const rules = fs.readdirSync(`${NAT}/term-rules`).flatMap((f) => JSON.parse(fs.readFileSync(`${NAT}/term-rules/${f}`, "utf8")) as StateRules[]).find((r) => r.state === st);
  if (!rules) throw new Error(`${st}: no term rules`);
  const checks = new Map(tsv(`${NAT}/cycle-check.tsv`).filter((r) => r.state === st).map((r) => [`${r.group}|${r.year}|${r.name}`, r]));
  const rfsCards = new Map(tsv(`${GAP}/rfs_pccc_directory_cards.tsv`).filter((r) => r.state === st).map((r) => [`${r.directory_year}|${r.name}`, r]));
  const dsa = ["current", "past"].flatMap((k) => {
    const d = JSON.parse(fs.readFileSync(`${GAP}/dsa_sunrise_dsa_${k}_state_sources.json`, "utf8"));
    return d.records.filter((r: { state: string }) => r.state === st).map((r: Record<string, string>) => ({ ...r, source_url: d.source_url }));
  });

  const endorsements: unknown[] = [];
  const gaps: string[] = [];
  for (const m of tsv(`${NAT}/matches.tsv`).filter((r) => r.state === st)) {
    const year = Number(m.year);
    if (year < 2022) continue;
    const seated = m.match === "seated" || m.match === "seated_name_only";
    const parsed = seat(m.office);
    const office = seated ? m.seated_chamber : parsed?.chamber === "governor" ? "governor" : parsed?.chamber;
    const district = office === "governor" ? null : seated ? m.seated_district : parsed?.district || null;
    if (!office || !["governor", "upper", "lower"].includes(office) || (office !== "governor" && !district)) {
      gaps.push(`${m.group} ${year}: ${m.name}, "${m.office}": chamber or district not parsed; not entered.`);
      continue;
    }
    let issuer: string, source: Cite, sourceNote: string;
    if (m.group === "wfp") {
      issuer = `${name} Working Families Party`;
      source = { url: m.source, excerpt: `${m.name} ${m.office}` };
      sourceNote = "On WFP's undated 2026 candidate list (saved copy research_notes/national/wfp-2026-candidates.tsv), so stage is general by rule.";
    } else if (m.group === "rfs") {
      const card = rfsCards.get(`${m.year}|${m.name}`);
      if (!card) throw new Error(`${st}: no RFS card for ${m.name} ${m.year}`);
      issuer = "Run for Something";
      source = { url: card.profile_url, excerpt: `${m.name} ${card.office.replace(/,\s*[A-Z]{2}$/, "")}` };
      sourceNote = `Run for Something ${m.year} directory card; no announcement date, so stage is general by rule.`;
    } else {
      const rec = dsa.find((r: Record<string, string>) => r.name === m.name && r.office === m.office);
      if (!rec) throw new Error(`${st}: no DSA record for ${m.name}`);
      const chapter = rec.endorsing_chapters.split(",")[0].trim();
      issuer = `${chapter} DSA`;
      source = { url: rec.source_url, excerpt: null };
      sourceNote = `DSA national endorsements table (Airtable embed, no fetchable text): row ${rec.row}, chapters "${rec.endorsing_chapters}", election date ${rec.election_date}. Stage general by rule.`;
    }

    const rule = rules.rules.find((r) => r.chamber === office);
    const cycle = rule?.elections.find((e) => e.year === year);
    const check = checks.get(`${m.group}|${m.year}|${m.name}`);
    let outcome = "unknown", result: Cite | null = null, current: unknown = null;
    let note = sourceNote;
    if (year === 2026) {
      outcome = "pending";
      note += " 2026 results not yet certified; recheck.";
    } else if (!seated) {
      note += ` Not on the current Open States roster for this seat (${m.match}); ${year} result not checked.`;
    } else if (!rule?.source || !cycle?.term_start) {
      note += ` On the current roster, but the term rules give no sourced ${office} term from a ${year} election; not listed.`;
    // A cycle check counts only with a fetched results page; snippet-only answers are not evidence.
    } else if (year === 2024 || (check?.current_term_from_that_year === "yes" && check.result_url)) {
      outcome = "won";
      const end = check?.term_end || cycle.term_end;
      result = check?.result_url ? { url: check.result_url, excerpt: check.result_excerpt || null } : { ...openStates(st), excerpt: m.seated_name };
      current = {
        status: status(cycle.term_start, end, today), term_start: cycle.term_start, term_end: end,
        service_source: { ...openStates(st), excerpt: m.seated_name }, contact_url: m.contact_url || null,
      };
      note += ` On the current Open States roster for this seat, which counts as the win (listing rules, 9 Nov 2026). Term dates from ${rules.state} term rules (${rule.source.url}): ${rule.start_rule}`;
      if (check?.notes) note += ` Cycle check: ${check.notes}`;
    } else {
      note += ` On the current roster, but the ${year} election did not produce the current term or could not be confirmed (cycle check: ${check ? `${check.won_that_year}/${check.current_term_from_that_year}. ${check.notes}` : "not run, term ended"}).`;
    }
    endorsements.push({
      person: m.name, office, district, issuer, group: m.group, issuer_source: null,
      election: { year, stage: "general" }, source, withdrawn: false, outcome, result_source: result, current, notes: note.trim(),
    });
  }

  const has = (g: string) => endorsements.some((e) => (e as { group: string }).group === g);
  const coverage = [
    { group: "wfp", checked: ["https://workingfamilies.org/candidates/"], note: "Only WFP's 2026 national list. Unchecked: state WFP pages and the 2022 and 2024 cycles." },
    { group: "rfs", checked: ["https://directory.runforsomething.net/"], note: "Run for Something directory cards 2022 to 2026 only (saved TSV)." },
    { group: "dsa", checked: [dsa[0]?.source_url ?? "DSA national table"], note: "Only the DSA national endorsement tables. Unchecked: chapter sites and social feeds." },
    { group: "or", checked: [], note: "Our Revolution not checked." },
    { group: "pccc", checked: [], note: "PCCC not checked." },
    { group: "sunrise", checked: [], note: "Sunrise not checked." },
  ].map((c) => ({ group: c.group, status: "blocked", checked: c.checked, note: `${c.note}${has(c.group) ? "" : " No entries from the sources checked."}` }));
  gaps.push("Drafted from national lists only (scripts/roster-seed.ts); entries before 2026 not on the current roster have no result check.");
  return { state: st, researched_at: today, chambers: rules.chambers, endorsements, coverage, gaps };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [today, ...states] = process.argv.slice(2);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today ?? "") || !states.length) throw new Error("usage: tsx scripts/roster-seed.ts YYYY-MM-DD ST...");
  for (const st of states) {
    const r = seed(st, today);
    fs.writeFileSync(`research_notes/roster/${st}.json`, JSON.stringify(r, null, 2) + "\n", { flag: "wx" });
    console.log(`${st}: ${r.endorsements.length} endorsements, ${r.gaps.length} gaps`);
  }
}
