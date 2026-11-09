// Writes data/outside-money.json: independent expenditures (FEC Schedule E) for and against each member, 2026 cycle.
// Uses regular-report rows only, without memo lines. Notices and memos repeat other rows and would double the totals.
// Usage: DATA_GOV_API_KEY=... tsx scripts/outside-money.ts   (free key at https://api.data.gov/signup/)
import fs from "node:fs";
import type { Member } from "@/lib/data";
import { checkedNow } from "@/lib/freshness";
import type { MoneyFile, Spend } from "@/lib/money";

const MEMBERS = "data/members.json";
const OUT = "data/outside-money.json";
const API = "https://api.open.fec.gov/v1";
const CYCLE = 2026;

async function api(path: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ ...params, api_key: process.env.DATA_GOV_API_KEY! });
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API}${path}?${qs}`);
    if (res.ok) return res.json();
    // api.data.gov rate-limits by the hour; back off rather than lose the run.
    if (res.status === 429 && attempt < 5) { await new Promise((r) => setTimeout(r, 60_000)); continue; }
    throw new Error(`api.open.fec.gov ${path}: HTTP ${res.status}`);
  }
}

// FEC candidate ids encode office and state: H6CA22190, S6VT00033.
export function candidateIdsFor(m: Member, ids: string[]) {
  return ids.filter((id) => id[0] === (m.office === "house" ? "H" : "S") && id.slice(2, 4) === m.state);
}

export function stageOf(electionType: string | null): Spend["stage"] {
  const code = electionType?.[0];
  if (code === "P" || code === "R") return "primary";
  if (code === "G") return "general";
  if (code === "S") return "special";
  throw new Error(`unknown FEC election_type ${electionType}`);
}

type Row = {
  candidate_id: string; committee_id: string; committee: { name: string } | null; support_oppose_indicator: "S" | "O";
  expenditure_amount: number; election_type: string | null; memo_code: string | null;
};

// Sums rows into one entry per committee, side and stage.
export function summarize(rows: Row[]): Spend[] {
  const out = new Map<string, Spend>();
  for (const r of rows) {
    if (r.support_oppose_indicator !== "S" && r.support_oppose_indicator !== "O") throw new Error(`bad support_oppose_indicator ${r.support_oppose_indicator}`);
    const side = r.support_oppose_indicator === "S" ? "support" : "oppose";
    const stage = stageOf(r.election_type);
    const key = `${r.committee_id}|${side}|${stage}`;
    const s = out.get(key) ?? { committee: r.committee_id, name: r.committee?.name ?? r.committee_id, side, stage, total: 0, count: 0 };
    s.total += r.expenditure_amount;
    s.count++;
    out.set(key, s);
  }
  return [...out.values()]
    .map((s) => ({ ...s, total: Math.round(s.total * 100) / 100 }))
    .filter((s) => s.total !== 0)
    .sort((a, b) => b.total - a.total || a.committee.localeCompare(b.committee));
}

async function rowsFor(candidate: string) {
  const rows: Row[] = [];
  let last: Record<string, string> = {};
  for (;;) {
    const d = await api("/schedules/schedule_e/", { candidate_id: candidate, cycle: String(CYCLE), is_notice: "false", most_recent: "true", per_page: "100", ...last });
    rows.push(...(d.results as Row[]).filter((r) => r.memo_code !== "X"));
    if (d.results.length < 100) return rows;
    last = d.pagination.last_indexes;
  }
}

// FEC's own per-committee totals. Ours must agree, or we are double counting or dropping rows.
async function check(candidate: string, spends: Spend[]) {
  const d = await api("/schedules/schedule_e/by_candidate/", { candidate_id: candidate, cycle: String(CYCLE), per_page: "100" });
  for (const a of d.results as { committee_id: string; support_oppose_indicator: string; total: number }[]) {
    const side = a.support_oppose_indicator === "S" ? "support" : "oppose";
    const ours = spends.filter((s) => s.committee === a.committee_id && s.side === side).reduce((n, s) => n + s.total, 0);
    if (Math.abs(ours - a.total) > 1) throw new Error(`${candidate} ${a.committee_id} ${side}: rows sum to ${ours}, FEC total is ${a.total}`);
  }
}

async function main() {
  if (!process.env.DATA_GOV_API_KEY) throw new Error("set DATA_GOV_API_KEY (free at https://api.data.gov/signup/)");
  const members = (JSON.parse(fs.readFileSync(MEMBERS, "utf8")) as { members: Member[] }).members;
  const file: MoneyFile = { cycle: CYCLE, checkedAt: checkedNow(), missing: [], spending: {} };
  for (const m of members) {
    if (!m.campaign) { file.missing.push(m.id); continue; }
    const committee = (await api(`/committee/${m.campaign.fec}/`)).results[0];
    const candidates = candidateIdsFor(m, committee?.candidate_ids ?? []);
    if (candidates.length === 0) throw new Error(`${m.id}: committee ${m.campaign.fec} lists no ${m.office} candidate in ${m.state}`);
    const rows: Row[] = [];
    for (const c of candidates) rows.push(...(await rowsFor(c)));
    const spends = summarize(rows);
    for (const c of candidates) await check(c, summarize(rows.filter((r) => r.candidate_id === c)));
    if (spends.length) file.spending[m.id] = spends;
    console.error(`${m.id}: ${spends.length} entries`);
  }
  fs.writeFileSync(OUT, JSON.stringify(file, null, 2) + "\n");
  console.log(`${Object.keys(file.spending).length} members with outside spending; ${file.missing.length} without an FEC committee on file.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
