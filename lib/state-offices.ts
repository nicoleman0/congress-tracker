import { createHash } from "node:crypto";
import raw from "@/data/state-publication.json";
import { canonical } from "@/lib/canonical";
import { STATES } from "@/lib/states";

export type StateSource = { id: string; url: string; label: string; checked_at: string };
type Person = { id: string; name: string; portrait_url: string | null; portrait_credit: string | null; portrait_source_id: string | null };
type Seat = { id: string; state: string; office: "governor" | "upper" | "lower" | "unicameral"; chamber: string; district: string | null; seat_label: string | null; capacity: number };
type Election = { id: string; seat_id: string; year: number; stage: string; cycle_election_id: string | null };
type Issuer = { id: string; name: string; group_code: string; parent_id: string | null; affiliation_source_id: string | null };
type Endorsement = { id: string; person_id: string; issuer_id: string; election_id: string; source_id: string; withdrawn: boolean };
type Reconciliation = { id: string; endorsement_id: string; outcome: "included" | "excluded" | "unresolved"; reason: string; term_id: string | null };
type Term = { id: string; person_id: string; seat_id: string; election_id: string | null; starts_on: string; ends_on: string | null; status: "serving" | "incoming" | "unresolved" | "ended"; service_source_id: string | null; result_source_id: string | null; contact_url: string | null; campaign_url: string | null; contact_source_id: string | null; campaign_source_id: string | null };
type Snapshot = { version: string; batch: { reviewed_at: string | null }; people: Person[]; seats: Seat[]; sources: StateSource[]; elections: Election[]; issuers: Issuer[]; endorsements: Endorsement[]; reconciliations: Reconciliation[]; terms: Term[]; coverage: Coverage[] };
export type Coverage = { state: string; group_code: string; status: string; note: string; checked_at: string };
type Envelope = { version: string; sha256: string; snapshot: Snapshot };
export type StateMember = { id: string; name: string; state: string; seat: Seat; term: Term; election: Election; service?: StateSource; result: StateSource; contactSource?: StateSource; campaignSource?: StateSource; endorsers: { issuer: Issuer; source: StateSource; election: Election }[]; portrait?: { url: string; credit: string; source: StateSource } };
const groups = ["wfp", "or", "dsa", "rfs", "pccc", "sunrise"];
const statuses = ["complete_with_entries", "complete_no_entries", "not_applicable", "blocked", "in_progress"];
export const coverageComplete = (c: Coverage) => ["complete_with_entries", "complete_no_entries", "not_applicable"].includes(c.status);
const stateCodes = STATES.filter((s) => s.code !== "DC").map((s) => s.code);
const date = (s: string) => s.slice(0, 10);

export function readStatePublication(input: unknown, today = new Date()): { version: string | null; reviewedAt: string | null; members: StateMember[]; coverage: Coverage[] } {
  if (input === null) return { version: null, reviewedAt: null, members: [], coverage: [] };
  const envelope = input as Envelope;
  if (!envelope || typeof envelope !== "object" || !envelope.snapshot || typeof envelope.version !== "string" || envelope.snapshot.version !== envelope.version || !/^[a-f0-9]{64}$/.test(envelope.sha256)) throw new Error("state publication: invalid envelope");
  const digest = createHash("sha256").update(canonical(envelope.snapshot)).digest("hex");
  if (digest !== envelope.sha256) throw new Error("state publication: hash mismatch");
  const s = envelope.snapshot;
  if (!s.batch?.reviewed_at || ![s.people, s.seats, s.sources, s.elections, s.issuers, s.endorsements, s.reconciliations, s.terms, s.coverage].every(Array.isArray)) throw new Error("state publication: invalid snapshot");
  // Every state and group needs a row; gaps (blocked, in_progress) are published with their notes.
  const cells = new Set(s.coverage.filter((c) => statuses.includes(c.status) && c.note?.trim()).map((c) => `${c.state}:${c.group_code}`));
  if (s.coverage.length !== stateCodes.length * groups.length || cells.size !== s.coverage.length || stateCodes.some((state) => groups.some((group) => !cells.has(`${state}:${group}`)))) throw new Error("state publication: missing coverage rows");
  const byId = <T extends { id: string }>(items: T[]) => {
    const map = new Map(items.map((item) => [item.id, item]));
    if (map.size !== items.length) throw new Error("state publication: duplicate id");
    return map;
  };
  const people = byId(s.people), seats = byId(s.seats), sources = byId(s.sources), elections = byId(s.elections), issuers = byId(s.issuers);
  byId(s.endorsements); byId(s.terms); byId(s.reconciliations);
  if (s.people.some((person) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(person.id)) || s.sources.some((source) => !source.url.startsWith("https://")) || s.seats.some((seat) => !Number.isInteger(seat.capacity) || seat.capacity < 1 || !["governor", "upper", "lower", "unicameral"].includes(seat.office))) throw new Error("state publication: invalid person, source or seat");
  const decisions = new Map(s.reconciliations.map((r) => [r.endorsement_id, r]));
  if (decisions.size !== s.reconciliations.length || s.endorsements.some((e) => !decisions.has(e.id) || decisions.get(e.id)!.outcome === "unresolved")) throw new Error("state publication: unreconciled endorsements");
  const lookup = <T,>(map: Map<string, T>, id: string | null): T => {
    const item = id && map.get(id);
    if (!item) throw new Error(`state publication: missing reference ${id}`);
    return item;
  };
  const byCoverage = new Map<string, Endorsement[]>();
  for (const endorsement of s.endorsements) {
    const key = `${lookup(seats, lookup(elections, endorsement.election_id).seat_id).state}:${lookup(issuers, endorsement.issuer_id).group_code}`;
    byCoverage.set(key, [...(byCoverage.get(key) ?? []), endorsement]);
  }
  for (const row of s.coverage) {
    const matching = byCoverage.get(`${row.state}:${row.group_code}`) ?? [];
    if (row.status === "complete_with_entries" && !matching.length) throw new Error(`state publication: missing entries ${row.state}/${row.group_code}`);
    if (["complete_no_entries", "not_applicable"].includes(row.status) && matching.some((e) => decisions.get(e.id)?.outcome === "included")) throw new Error(`state publication: contradictory coverage ${row.state}/${row.group_code}`);
  }
  const now = today.toISOString().slice(0, 10);
  // Uncalled races stay off the site until called (docs/plans/state-offices.md).
  const members = s.terms.filter((term) => term.status === "serving" || term.status === "incoming").map((term) => {
    const person = lookup(people, term.person_id), seat = lookup(seats, term.seat_id), election = lookup(elections, term.election_id);
    const result = lookup(sources, term.result_source_id);
    if (!stateCodes.includes(seat.state) || !["general", "special"].includes(election.stage) || election.seat_id !== seat.id || (term.status === "serving" && (date(term.starts_on) > now || (term.ends_on && date(term.ends_on) <= now) || !term.service_source_id)) || (term.status === "incoming" && date(term.starts_on) <= now)) throw new Error(`state publication: invalid term ${term.id}`);
    const endorsements = s.endorsements.filter((e) => e.person_id === person.id && !e.withdrawn && decisions.get(e.id)?.outcome === "included" && decisions.get(e.id)?.term_id === term.id && (() => { const endorsed = lookup(elections, e.election_id); return endorsed.seat_id === seat.id && endorsed.year === election.year && (endorsed.id === election.id || (endorsed.stage === "primary" && endorsed.cycle_election_id === election.id)); })());
    if (!endorsements.length || (!term.contact_url && !term.campaign_url)) throw new Error(`state publication: missing evidence for ${term.id}`);
    return { id: person.id, name: person.name, state: seat.state, seat, term, election, ...(term.service_source_id ? { service: lookup(sources, term.service_source_id) } : {}), result, ...(term.contact_url ? { contactSource: lookup(sources, term.contact_source_id) } : {}), ...(term.campaign_url ? { campaignSource: lookup(sources, term.campaign_source_id) } : {}), endorsers: endorsements.map((e) => ({ issuer: lookup(issuers, e.issuer_id), source: lookup(sources, e.source_id), election: lookup(elections, e.election_id) })), ...(person.portrait_url && person.portrait_credit ? { portrait: { url: person.portrait_url, credit: person.portrait_credit, source: lookup(sources, person.portrait_source_id) } } : {}) };
  });
  if (!members.some((m) => m.term.status === "serving")) throw new Error("state publication: no serving members");
  for (const seat of s.seats) if (members.filter((m) => m.seat.id === seat.id && m.term.status === "serving").length > seat.capacity) throw new Error(`state publication: seat capacity exceeded ${seat.id}`);
  return { version: envelope.version, reviewedAt: s.batch.reviewed_at, members, coverage: s.coverage };
}
const publication = readStatePublication(raw);
export const statePublicationVersion = publication.version;
export const statePublicationReviewedAt = publication.reviewedAt;
export const stateMembers = () => publication.members;
export const GROUP_NAMES: Record<string, string> = { wfp: "Working Families Party", or: "Our Revolution", dsa: "DSA", rfs: "Run for Something", pccc: "PCCC", sunrise: "Sunrise Movement" };
export const stateCoverage = (state: string) => publication.coverage.filter((c) => c.state === state);
export const getStateMember = (id: string) => stateMembers().filter((m) => m.id === id).sort((a, b) => ["serving", "incoming"].indexOf(a.term.status) - ["serving", "incoming"].indexOf(b.term.status))[0];
export const stateSeatLabel = (m: StateMember) => `${m.state} ${m.seat.chamber}${m.seat.district ? ` · District ${m.seat.district}` : ""}${m.seat.seat_label ? ` · ${m.seat.seat_label}` : ""}`;
