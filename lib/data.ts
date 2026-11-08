// The only module that knows where roster data lives. Swap this for a database later.
import raw from "@/data/members.json";
import { STATES, type State } from "@/lib/states";

export type Office = "house" | "senate";
export type Status = "won" | "leading" | "pending" | "incumbent" | "lost";

export type Group = { code: string; name: string; url: string };
export type Source = { label: string; url: string };
// Campaign site as filed on the committee's FEC Form 1. `fec` is the committee id, for provenance.
export type Campaign = { url: string; fec: string };
export type Member = {
  id: string;
  name: string;
  office: Office;
  incumbent: boolean;
  state: string;
  district: string | null;
  endorsedBy: string[];
  status: Status;
  note: string;
  source: Source;
  campaign?: Campaign;
  checkedAt: string;
};

// Unresolved races older than this fail the build (scripts/check-stale.ts).
export const STALE_AFTER_DAYS = 3;
const UNRESOLVED: Status[] = ["leading", "pending"];
const DAY_MS = 86_400_000;

const OFFICES: Office[] = ["house", "senate"];
const STATUSES: Status[] = ["won", "leading", "pending", "incumbent", "lost"];

function fail(msg: string): never {
  throw new Error(`data/members.json: ${msg}`);
}

function load() {
  const groups = new Map<string, Group>(
    Object.entries(raw.groups).map(([code, g]) => [code, { code, ...g }]),
  );
  const stateCodes = new Set(STATES.map((s) => s.code));
  const ids = new Set<string>();
  const members = (raw.members as Member[]).map((m) => {
    if (ids.has(m.id)) fail(`duplicate id ${m.id}`);
    ids.add(m.id);
    if (!OFFICES.includes(m.office)) fail(`${m.id}: bad office ${m.office}`);
    if (!STATUSES.includes(m.status)) fail(`${m.id}: bad status ${m.status}`);
    if (!stateCodes.has(m.state)) fail(`${m.id}: unknown state ${m.state}`);
    if (m.office === "house" && !m.district) fail(`${m.id}: House member needs a district`);
    if (m.office === "senate" && m.district !== null) fail(`${m.id}: senator must have null district`);
    if (m.endorsedBy.length === 0) fail(`${m.id}: no reason for listing`);
    for (const g of m.endorsedBy) if (!groups.has(g)) fail(`${m.id}: unknown group ${g}`);
    if (!m.source?.url.startsWith("https://")) fail(`${m.id}: source needs an https url`);
    if (m.campaign && !m.campaign.url.startsWith("https://")) fail(`${m.id}: campaign needs an https url`);
    if (m.campaign && !/^C\d{8}$/.test(m.campaign.fec)) fail(`${m.id}: campaign.fec must be an FEC committee id`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(m.checkedAt)) fail(`${m.id}: checkedAt must be YYYY-MM-DD`);
    return m;
  });
  return { groups, members };
}

export function staleMembers(members: Member[], now: Date): Member[] {
  return members.filter(
    (m) => UNRESOLVED.includes(m.status) && now.getTime() - Date.parse(m.checkedAt) > STALE_AFTER_DAYS * DAY_MS,
  );
}

const db = load();

export const lastChecked = db.members.map((m) => m.checkedAt).sort().at(-1)!;
export const allMembers = (): Member[] => db.members;
export const getMember = (id: string) => db.members.find((m) => m.id === id);
export const getGroup = (code: string) => db.groups.get(code)!;
export const groupList = () => [...db.groups.values()];

export const newClass = () =>
  db.members.filter((m) => !m.incumbent && (m.status === "won" || m.status === "leading"));
export const toWatch = () => db.members.filter((m) => m.status === "pending" || m.status === "leading");

export const membersIn = (state: string) => db.members.filter((m) => m.state === state && m.status !== "lost");
export const lostRaces = () => db.members.filter((m) => m.status === "lost");
export const getState = (code: string): State | undefined => STATES.find((s) => s.code === code);

export function districtsOf(state: State): string[] {
  if (state.seats === 1) return ["AL"];
  return Array.from({ length: state.seats }, (_, i) => String(i + 1));
}

export const fecCommitteeUrl = (c: Campaign) => `https://www.fec.gov/data/committee/${c.fec}/`;

export function seatLabel(m: Member) {
  if (m.office === "senate") return `${m.state} Senate`;
  return m.district === "AL" ? `${m.state} at-large` : `${m.state}-${m.district}`;
}
