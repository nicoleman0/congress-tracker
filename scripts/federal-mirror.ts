// Copies the committed congressional JSON into Neon for analysis. The JSON stays canonical; nothing writes back.
// Usage: DATABASE_URL=... npx tsx scripts/federal-mirror.ts load
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { Client } from "pg";
// Importing lib/data validates members, platform and photos with the build's rules.
import { groupList, type Member, type Photo, type Stance } from "@/lib/data";
import { validateEndorsements, type EndorsementFile } from "@/lib/endorsements";
import { MIGRATION_LOCK, migrate, sha256, transaction } from "./db";

export const FILES = ["data/members.json", "data/platform.json", "data/photos.json", "data/endorsements-2028.json"];

export type MirrorInput = {
  members: { groups: Record<string, { name: string; url: string }>; members: Member[] };
  platform: { issues: Record<string, string>; stances: Record<string, Stance[]> };
  photos: Record<string, Photo>;
  endorsements: EndorsementFile[];
};

// A field the mirror doesn't know would be dropped silently, so fail and make someone add it.
function only(obj: object, keys: string[], where: string) {
  const extra = Object.keys(obj).filter((k) => !keys.includes(k));
  if (extra.length) throw new Error(`${where}: field ${extra.join(", ")} is not mirrored; add it to db/federal and scripts/federal-mirror.ts`);
}
// Date-only values parse as UTC midnight.
const iso = (s: string) => new Date(s).toISOString();

export function rows(input: MirrorInput) {
  only(input.members, ["groups", "members"], "members.json");
  only(input.platform, ["issues", "stances"], "platform.json");
  const groups = Object.entries(input.members.groups).map(([code, g]) => {
    only(g, ["name", "url"], `group ${code}`);
    return { code, name: g.name, url: g.url };
  });
  const members = input.members.members.map((m) => {
    only(m, ["id", "name", "office", "incumbent", "state", "district", "endorsedBy", "status", "note", "source", "campaign", "checkedAt"], `member ${m.id}`);
    return {
      id: m.id, name: m.name, office: m.office, incumbent: m.incumbent, state: m.state, district: m.district, status: m.status, note: m.note,
      source_label: m.source.label, source_url: m.source.url, campaign_url: m.campaign?.url ?? null, campaign_fec: m.campaign?.fec ?? null,
      checked_at: iso(m.checkedAt),
    };
  });
  const member_groups = input.members.members.flatMap((m) => m.endorsedBy.map((group_code) => ({ member_id: m.id, group_code })));
  const issues = Object.entries(input.platform.issues).map(([code, name], position) => ({ code, name, position }));
  const stances = Object.entries(input.platform.stances).flatMap(([member_id, list]) =>
    list.map((s, position) => {
      only(s, ["issue", "text", "kind", "quote", "source", "checkedAt"], `stance ${member_id}/${s.issue}`);
      return {
        member_id, position, issue: s.issue, text: s.text, kind: s.kind, quote: s.quote ?? null,
        source_label: s.source.label, source_url: s.source.url, checked_at: iso(s.checkedAt),
      };
    }));
  const photos = Object.entries(input.photos).map(([member_id, p]) => {
    only(p, ["src", "width", "height", "bioguide", "credit"], `photo ${member_id}`);
    return { member_id, ...p };
  });
  const candidates = input.endorsements.flatMap((f) => {
    only(f, ["cycle", "candidates"], `endorsements-${f.cycle}.json`);
    return f.candidates.map((c) => {
      only(c, ["id", "name", "office", "state", "district", "seat", "memberId", "note", "endorsements"], `candidate ${c.id}`);
      return { cycle: f.cycle, id: c.id, name: c.name, office: c.office, state: c.state, district: c.district, seat: c.seat, member_id: c.memberId ?? null, note: c.note };
    });
  });
  const candidate_endorsements = input.endorsements.flatMap((f) => f.candidates.flatMap((c) =>
    c.endorsements.map((e) => ({ cycle: f.cycle, candidate_id: c.id, group_code: e.group, url: e.url, checked_at: iso(e.checkedAt) }))));
  // Insert order follows the foreign keys.
  return { groups, members, member_groups, issues, stances, photos, candidates, candidate_endorsements };
}

// Loads `input` once per distinct content and records that `commit` had it.
export async function loadInto(db: Client, input: MirrorInput, commit: string) {
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error(`not a full commit hash: ${commit}`);
  const tables = rows(input);
  // Key order is file order, so the same files always hash the same.
  const load = sha256(JSON.stringify(input));
  return transaction(db, async (tx) => {
    await tx.query("SELECT pg_advisory_xact_lock($1)", [MIGRATION_LOCK]);
    const created = (await tx.query("INSERT INTO federal.loads (id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id", [load])).rowCount === 1;
    if (created) {
      for (const [table, list] of Object.entries(tables)) {
        if (!list.length) continue;
        const json = JSON.stringify(list.map((r) => ({ load_id: load, ...r })));
        await tx.query(`INSERT INTO federal.${table} SELECT * FROM jsonb_populate_recordset(NULL::federal.${table}, $1::jsonb)`, [json]);
      }
    }
    const prior = await tx.query("SELECT load_id FROM federal.syncs WHERE git_commit = $1", [commit]);
    if (prior.rowCount && prior.rows[0].load_id !== load) throw new Error(`commit ${commit} was already synced with different content`);
    if (!prior.rowCount) await tx.query("INSERT INTO federal.syncs (git_commit, load_id) VALUES ($1, $2)", [commit, load]);
    return { load, created, synced: !prior.rowCount };
  });
}

export async function migrateAll(db: Client) {
  // Analysis views read both schemas, so they migrate last.
  await migrate(db, "state_offices", "db/state-offices");
  await migrate(db, "federal", "db/federal");
  await migrate(db, "analysis", "db/analysis");
}

const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" }).trim();

// Only data that is committed and on main gets mirrored, so every load maps to a published commit.
function committedInput(): { input: MirrorInput; commit: string } {
  if (git("status", "--porcelain", "--", ...FILES)) throw new Error(`uncommitted changes in ${FILES.join(", ")}; commit them first`);
  const commit = git("log", "-1", "--format=%H", "--", ...FILES);
  try { git("merge-base", "--is-ancestor", commit, "origin/main"); }
  catch { throw new Error(`data commit ${commit} is not on origin/main; run git fetch or merge first`); }
  const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
  const groups = new Set(groupList().map((g) => g.code));
  const endorsements = FILES.filter((f) => f.includes("endorsements-")).map((f) => validateEndorsements(read(f), groups));
  return { commit, input: { members: read(FILES[0]), platform: read(FILES[1]), photos: read(FILES[2]), endorsements } };
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!["migrate", "load"].includes(command) || args.length) throw new Error("usage: federal-mirror migrate | load");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const { input, commit } = command === "load" ? committedInput() : { input: null, commit: "" };
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await migrateAll(db);
    if (input) {
      const r = await loadInto(db, input, commit);
      console.log(`${commit} -> load ${r.load}${r.created ? " (new content)" : ""}${r.synced ? "" : " (already synced)"}`);
    }
  } finally { await db.end(); }
}
if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
