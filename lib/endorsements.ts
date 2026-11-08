// Endorsements for a later cycle, kept apart from data/members.json so 2026 results and the
// site's 2026 pages are untouched. Not wired into the UI yet.
import raw from "@/data/endorsements-2028.json";
import { groupList, type Office } from "@/lib/data";
import { CHECKED_AT } from "@/lib/freshness";
import { STATES } from "@/lib/states";

export type Seat = "open" | "incumbent" | "challenger";
// `url` is the group's own page naming the candidate. Each endorsement ages on its own.
export type Endorsement = { group: string; url: string; checkedAt: string };
export type Candidate = {
  id: string;
  name: string;
  office: Office;
  state: string;
  district: string | null;
  seat: Seat;
  // Set when the person is already in data/members.json.
  memberId?: string;
  note: string;
  endorsements: Endorsement[];
};
export type EndorsementFile = { cycle: number; candidates: Candidate[] };

// No race to resolve, so only the endorsement itself can go stale. Warned about, never fails the build.
export const ENDORSEMENT_STALE_AFTER_DAYS = 180;
const SEATS: Seat[] = ["open", "incumbent", "challenger"];

export function validateEndorsements(file: EndorsementFile, groups: Set<string>): EndorsementFile {
  const fail = (msg: string): never => { throw new Error(`data/endorsements-${file.cycle}.json: ${msg}`); };
  const states = new Set(STATES.map((s) => s.code));
  const ids = new Set<string>();
  for (const c of file.candidates) {
    if (ids.has(c.id)) fail(`duplicate id ${c.id}`);
    ids.add(c.id);
    if (!["house", "senate"].includes(c.office)) fail(`${c.id}: bad office ${c.office}`);
    if (!SEATS.includes(c.seat)) fail(`${c.id}: bad seat ${c.seat}`);
    if (!states.has(c.state)) fail(`${c.id}: unknown state ${c.state}`);
    if (c.office === "house" && !c.district) fail(`${c.id}: House candidate needs a district`);
    if (c.office === "senate" && c.district !== null) fail(`${c.id}: senate candidate must have null district`);
    if (c.endorsements.length === 0) fail(`${c.id}: no endorsements`);
    const seen = new Set<string>();
    for (const e of c.endorsements) {
      if (!groups.has(e.group)) fail(`${c.id}: unknown group ${e.group}`);
      if (seen.has(e.group)) fail(`${c.id}: ${e.group} listed twice`);
      seen.add(e.group);
      if (!e.url?.startsWith("https://")) fail(`${c.id}: ${e.group} needs an https url`);
      if (!CHECKED_AT.test(e.checkedAt)) fail(`${c.id}: ${e.group} checkedAt must be YYYY-MM-DD or YYYY-MM-DDTHH:MMZ`);
    }
  }
  return file;
}

export function staleEndorsements(file: EndorsementFile, now: Date) {
  return file.candidates.flatMap((c) =>
    c.endorsements
      .filter((e) => now.getTime() - Date.parse(e.checkedAt) > ENDORSEMENT_STALE_AFTER_DAYS * 86_400_000)
      .map((e) => ({ id: c.id, group: e.group, checkedAt: e.checkedAt })),
  );
}

const file = validateEndorsements(raw as EndorsementFile, new Set(groupList().map((g) => g.code)));
export const endorsementFile = (): EndorsementFile => file;
