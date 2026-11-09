// Outside spending (FEC independent expenditures) for and against listed members. Built by scripts/outside-money.ts.
import raw from "@/data/outside-money.json";
import { allMembers, listedMembers, type Member } from "@/lib/data";
import { CHECKED_AT } from "@/lib/freshness";

export type Side = "support" | "oppose";
export type Stage = "primary" | "general" | "special";
// One committee's spending on one side of one member's race at one stage.
export type Spend = { committee: string; name: string; side: Side; stage: Stage; total: number; count: number };
export type MoneyFile = { cycle: number; checkedAt: string; missing: string[]; spending: Record<string, Spend[]> };

export function validateMoney(file: MoneyFile, ids: Set<string>): MoneyFile {
  const fail = (msg: string): never => { throw new Error(`data/outside-money.json: ${msg}`); };
  if (!CHECKED_AT.test(file.checkedAt)) fail("checkedAt must be YYYY-MM-DD or YYYY-MM-DDTHH:MMZ");
  for (const id of file.missing) if (!ids.has(id)) fail(`missing: unknown member ${id}`);
  for (const [id, list] of Object.entries(file.spending)) {
    if (!ids.has(id)) fail(`unknown member ${id}`);
    for (const s of list) {
      if (!/^C\d{8}$/.test(s.committee)) fail(`${id}: bad committee id ${s.committee}`);
      if (!["support", "oppose"].includes(s.side)) fail(`${id}: bad side ${s.side}`);
      if (!["primary", "general", "special"].includes(s.stage)) fail(`${id}: bad stage ${s.stage}`);
      if (!Number.isFinite(s.total)) fail(`${id}: bad total for ${s.committee}`);
    }
  }
  return file;
}

const file = validateMoney(raw as MoneyFile, new Set(allMembers().map((m) => m.id)));
export const moneyFile = () => file;
export const spendingOn = (id: string): Spend[] => file.spending[id] ?? [];
export const fecSpenderUrl = (committee: string) => `https://www.fec.gov/data/committee/${committee}/?cycle=${file.cycle}`;

export type Spender = { committee: string; name: string; total: number; members: { member: Member; total: number }[] };

// Committees ranked by what they spent on one side, across the members given, optionally at one stage.
export function topSpenders(members: Member[], side: Side, stage?: Stage, spending = file.spending): Spender[] {
  const by = new Map<string, Spender>();
  for (const m of members) {
    for (const s of spending[m.id] ?? []) {
      if (s.side !== side || (stage && s.stage !== stage)) continue;
      const sp = by.get(s.committee) ?? { committee: s.committee, name: s.name, total: 0, members: [] };
      sp.total += s.total;
      const row = sp.members.find((x) => x.member.id === m.id);
      if (row) row.total += s.total; else sp.members.push({ member: m, total: s.total });
      by.set(s.committee, sp);
    }
  }
  for (const sp of by.values()) sp.members.sort((a, b) => b.total - a.total);
  return [...by.values()].sort((a, b) => b.total - a.total);
}

export const sum = (list: Spend[], side: Side, stage?: Stage) =>
  list.filter((s) => s.side === side && (!stage || s.stage === stage)).reduce((n, s) => n + s.total, 0);

// Members ranked by spending against them.
export const mostOpposed = (members = listedMembers(), spending = file.spending) =>
  members
    .map((m) => ({ member: m, against: sum(spending[m.id] ?? [], "oppose"), for: sum(spending[m.id] ?? [], "support") }))
    .filter((x) => x.against > 0)
    .sort((a, b) => b.against - a.against);

export const dollars = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)} million` : `$${Math.round(n).toLocaleString("en-US")}`;

// FEC names are all caps with legal clauses. Readable form: drop "(…)", "DBA …", "INC." and the like, then title-case.
const ACRONYMS = new Set("AFL AFP AFSCME AFT AIPAC AP API BDA CAP CIO CLF COPE CSP CVA CWC DLP DMFI FF HMP JDCA LCV LGBTQ MAGA MN NAKASEC NEA NY NYFB PA PAC PAF SD SEED SEIU SF SURJ TX UAW UDP USA".split(" "));
const SMALL = new Set("a an and at by for in of on or the to with".split(" "));
const NAME_OVERRIDES: Record<string, string> = {
  "AMERICAN FEDERATION OF STATE COUNTY & MUNICIPAL EMPLOYEES  P E O P L E": "AFSCME People",
  "CATHOLICVOTE.ORG": "CatholicVote.org",
  "GIVEGREEN UNITED ACTION": "GiveGreen United Action",
  "GRAYPAC": "GrayPAC",
  "MOMSRISING PAC": "MomsRising PAC",
  "MOVEON.ORG POLITICAL ACTION": "MoveOn.org Political Action",
  "TAKEACTION MN FEDERAL FUND": "TakeAction MN Federal Fund",
  "VOTEVETS": "VoteVets",
  "UAW - V - CAP (UAW VOLUNTARY COMMUNITY ACTION PROGRAM) 'INT'L UNION UNITED AUTOMOBILE AEROSPACE & AGRICULTURAL IMPLEMENT WORKERS OF AMERICA UAW": "UAW V-CAP",
  "WESTERN STATES REGIONAL COUNCIL OF CARPENTERS LEGISLATIVE IMPROVEMENT CMTE UNITED BROTHERHOOD OF CARPENTERS & JOINERS OF AMERICA": "Western States Regional Council of Carpenters",
};

const caseWord = (w: string, first: boolean) =>
  w.split("-").map((p) => {
    if (ACRONYMS.has(p.replace(/[^A-Z]/g, ""))) return p;
    const lower = p.toLowerCase();
    return !first && SMALL.has(lower) ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join("-");

export function committeeName(fecName: string): string {
  if (NAME_OVERRIDES[fecName]) return NAME_OVERRIDES[fecName];
  const core = fecName
    .split(/\s*\(|\s+DBA\s|,\s*SPONSORED BY\s|:\s/)[0]
    .replace(/,?\s+(INC|L\.L\.C|LLC)\.?$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return core.split(" ").map((w, i) => caseWord(w, i === 0)).join(" ");
}
