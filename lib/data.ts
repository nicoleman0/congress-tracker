// The only module that knows where roster data lives. Swap this for a database later.
import raw from "@/data/members.json";
import rawPhotos from "@/data/photos.json";
import rawPlatform from "@/data/platform.json";
import type { SearchEntry } from "@/lib/search";
import { CHECKED_AT } from "@/lib/freshness";
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

// "campaign": the member's campaign site. "office": their official House or Senate site.
// "congress": a vote or cosponsorship on the public record.
export type StanceKind = "campaign" | "office" | "congress";
// `quote` is the passage on the source page the stance paraphrases; scripts/check-platform.ts rechecks it.
// Record stances have none: scripts/record.ts rebuilds them from Congress.gov.
export type Stance = { issue: string; text: string; kind: StanceKind; quote?: string; source: Source; checkedAt: string };
// Official portrait from Congress.gov, saved by scripts/photos.ts. `bioguide` links back to the source.
export type Photo = { src: string; width: number; height: number; bioguide: string; credit: string };
const RECORD_HOSTS = /^https:\/\/(www\.)?(congress\.gov|clerk\.house\.gov|senate\.gov)\//;
const OFFICE_HOSTS = /^https:\/\/[a-z-]+\.(house|senate)\.gov\//;

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
    if (!CHECKED_AT.test(m.checkedAt)) fail(`${m.id}: checkedAt must be YYYY-MM-DD or YYYY-MM-DDTHH:MMZ`);
    return m;
  });

  const issues = new Map(Object.entries(rawPlatform.issues));
  const stances = new Map<string, Stance[]>();
  for (const [id, list] of Object.entries(rawPlatform.stances as Record<string, Stance[]>)) {
    if (!ids.has(id)) fail(`platform: unknown member ${id}`);
    for (const s of list) {
      if (!issues.has(s.issue)) fail(`platform ${id}: unknown issue ${s.issue}`);
      if (!s.text.trim()) fail(`platform ${id}: empty stance on ${s.issue}`);
      if (!["campaign", "office", "congress"].includes(s.kind)) fail(`platform ${id}: bad kind ${s.kind}`);
      if (!s.source?.url.startsWith("https://")) fail(`platform ${id}: source needs an https url`);
      if (s.kind === "congress" && !RECORD_HOSTS.test(s.source.url)) fail(`platform ${id}: congress stance must cite congress.gov, clerk.house.gov or senate.gov`);
      if (s.kind !== "congress" && !s.quote?.trim()) fail(`platform ${id}: ${s.issue} needs the quote it paraphrases`);
      if (s.kind === "office" && !OFFICE_HOSTS.test(s.source.url)) fail(`platform ${id}: office stance must cite a house.gov or senate.gov member site`);
      if (!CHECKED_AT.test(s.checkedAt)) fail(`platform ${id}: checkedAt must be YYYY-MM-DD or YYYY-MM-DDTHH:MMZ`);
    }
    stances.set(id, list);
  }
  const photos = new Map(Object.entries(rawPhotos as Record<string, Photo>));
  for (const [id, ph] of photos) {
    if (!ids.has(id)) fail(`photos: unknown member ${id}`);
    if (ph.src !== `/photos/${id}.jpg`) fail(`photos ${id}: src must be /photos/${id}.jpg`);
  }
  return { groups, members, issues, stances, photos };
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
export const getPhoto = (id: string) => db.photos.get(id);
export const getGroup = (code: string) => db.groups.get(code)!;
export const groupList = () => [...db.groups.values()];

// A member's stances grouped by issue, in the fixed issue order.
export function platformOf(id: string): { issue: string; name: string; stances: Stance[] }[] {
  const list = db.stances.get(id) ?? [];
  return [...db.issues]
    .map(([issue, name]) => ({ issue, name, stances: list.filter((s) => s.issue === issue) }))
    .filter((g) => g.stances.length > 0);
}

export const newClass = () =>
  db.members.filter((m) => !m.incumbent && (m.status === "won" || m.status === "leading"));

// Members who lost keep their page but drop out of lists and counts.
export const listedMembers = () => db.members.filter((m) => m.status !== "lost");
export const membersIn = (state: string) => listedMembers().filter((m) => m.state === state);
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

export const searchEntries = (): SearchEntry[] =>
  db.members.map((m) => ({ id: m.id, name: m.name, seat: seatLabel(m), stateName: getState(m.state)!.name }));
