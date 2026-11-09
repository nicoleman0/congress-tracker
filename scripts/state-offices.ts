import { readFile, writeFile } from "node:fs/promises";
import { Client } from "pg";
import { STATES } from "../lib/states";
import { canonical } from "../lib/canonical";
import { MIGRATION_LOCK, migrate, sha256 as hash, transaction } from "./db";
export { canonical } from "../lib/canonical";

const tables = {
  people: ["id", "name", "portrait_url", "portrait_credit", "portrait_source_id"],
  seats: ["id", "state", "office", "chamber", "district", "seat_label", "capacity"],
  sources: ["id", "url", "label", "checked_at", "excerpt"],
  elections: ["id", "seat_id", "year", "stage", "election_date", "cycle_election_id"],
  terms: ["id", "person_id", "seat_id", "election_id", "starts_on", "ends_on", "status", "service_source_id", "result_source_id", "contact_url", "campaign_url", "contact_source_id", "campaign_source_id"],
  issuers: ["id", "name", "parent_id", "group_code", "affiliation_source_id"],
  endorsements: ["id", "person_id", "issuer_id", "election_id", "source_id", "withdrawn"],
  reconciliations: ["id", "endorsement_id", "outcome", "reason", "term_id", "evidence_source_id"],
  coverage: ["state", "group_code", "status", "note", "checked_at"],
} as const;
type Table = keyof typeof tables;
type Input = Record<Table, Record<string, unknown>[]>;
const names = Object.keys(tables) as Table[];
const stateCodes = new Set(STATES.filter((s) => s.code !== "DC").map((s) => s.code));

export function validateInput(input: unknown): asserts input is Input {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("input must be an object");
  const obj = input as Record<string, unknown>;
  if (Object.keys(obj).some((key) => !names.includes(key as Table))) throw new Error("unknown input table");
  for (const name of names) {
    const rows = obj[name];
    if (!Array.isArray(rows)) throw new Error(`${name} must be an array`);
    for (const row of rows) {
      if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error(`${name}: expected an object`);
      if (Object.keys(row).some((key) => !(tables[name] as readonly string[]).includes(key))) throw new Error(`${name}: unknown field`);
      if (name !== "coverage" && (typeof row.id !== "string" || !row.id.trim())) throw new Error(`${name}: id is required`);
      if (name === "people" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id)) throw new Error("people: invalid URL id");
      if ((name === "coverage" || name === "seats") && !stateCodes.has(row.state)) throw new Error(`${name}: invalid state`);
    }
  }
}
export async function batchContents(db: Client, id: string): Promise<Record<string, unknown>> {
  const contents: Record<string, unknown> = {};
  for (const table of names) contents[table] = (await db.query(`SELECT * FROM state_offices.${table} WHERE batch_id=$1 ORDER BY ${table === "coverage" ? "state, group_code" : "id"}`, [id])).rows;
  return contents;
}
async function importBatch(db: Client, path: string) {
  const input: unknown = JSON.parse(await readFile(path, "utf8"));
  validateInput(input);
  const content = canonical(input);
  const id = hash(content);
  await transaction(db, async (tx) => {
    const inserted = await tx.query("INSERT INTO state_offices.batches (id, content_hash) VALUES ($1,$1) ON CONFLICT DO NOTHING RETURNING id", [id]);
    if (!inserted.rowCount) return;
    for (const name of names) {
      const columns = tables[name] as readonly string[];
      const fields = columns.map((s) => `"${s}"`).join(",");
      const rows = input[name].map((row) => Object.fromEntries(columns.map((c) => [c, row[c] ?? (name === "seats" && c === "capacity" ? 1 : null)])));
      if (rows.length) await tx.query(`INSERT INTO state_offices.${name} (batch_id, ${fields}) SELECT $1, ${fields} FROM jsonb_populate_recordset(NULL::state_offices.${name}, $2::jsonb)`, [id, JSON.stringify(rows)]);
    }
  });
  console.log(id);
}
async function review(db: Client, id: string, reviewer: string) {
  if (!reviewer?.trim()) throw new Error("reviewer is required");
  await transaction(db, async (tx) => {
    const existing = await tx.query("SELECT id FROM state_offices.batches WHERE id=$1 AND reviewed_at IS NULL FOR UPDATE", [id]);
    if (!existing.rowCount) throw new Error("batch not found or already reviewed");
    const reviewHash = hash(canonical(await batchContents(tx, id)));
    await tx.query("UPDATE state_offices.batches SET reviewed_at=now(), reviewer=$2, review_hash=$3 WHERE id=$1", [id, reviewer, reviewHash]);
  });
}
export async function publicationProblems(db: Client, id: string): Promise<string[]> {
  const problems: string[] = [];
  const batch = await db.query("SELECT reviewed_at FROM state_offices.batches WHERE id=$1", [id]);
  if (!batch.rowCount || !batch.rows[0].reviewed_at) problems.push("batch is missing or unreviewed");
  const count = await db.query("SELECT count(*)::integer AS n FROM state_offices.terms WHERE batch_id=$1 AND status='serving'", [id]);
  if (!count.rows[0].n) problems.push("batch has no serving terms");
  const coverage = await db.query("SELECT state, group_code, status FROM state_offices.coverage WHERE batch_id=$1", [id]);
  const blankNotes = await db.query("SELECT state,group_code FROM state_offices.coverage WHERE batch_id=$1 AND length(trim(note))=0", [id]);
  for (const row of blankNotes.rows) problems.push(`coverage requires a review note: ${row.state}/${row.group_code}`);
  const rows = new Set(coverage.rows.map((r) => `${r.state}:${r.group_code}`));
  for (const state of stateCodes) for (const group of ["wfp", "or", "dsa", "rfs", "pccc", "sunrise"]) if (!rows.has(`${state}:${group}`)) problems.push(`coverage row missing: ${state}/${group}`);
  const missingEntries = await db.query(`SELECT c.state,c.group_code FROM state_offices.coverage c WHERE c.batch_id=$1 AND c.status='complete_with_entries'
    AND NOT EXISTS (SELECT 1 FROM state_offices.endorsements d JOIN state_offices.issuers i ON i.batch_id=d.batch_id AND i.id=d.issuer_id
      JOIN state_offices.elections e ON e.batch_id=d.batch_id AND e.id=d.election_id JOIN state_offices.seats s ON s.batch_id=e.batch_id AND s.id=e.seat_id
      WHERE d.batch_id=c.batch_id AND i.group_code=c.group_code AND s.state=c.state)`, [id]);
  for (const row of missingEntries.rows) problems.push(`coverage claims missing entries: ${row.state}/${row.group_code}`);
  const contradictory = await db.query(`SELECT c.state,c.group_code FROM state_offices.coverage c WHERE c.batch_id=$1 AND c.status IN ('complete_no_entries','not_applicable')
    AND EXISTS (SELECT 1 FROM state_offices.endorsements d JOIN state_offices.reconciliations r ON r.batch_id=d.batch_id AND r.endorsement_id=d.id AND r.outcome='included'
      JOIN state_offices.issuers i ON i.batch_id=d.batch_id AND i.id=d.issuer_id JOIN state_offices.elections e ON e.batch_id=d.batch_id AND e.id=d.election_id
      JOIN state_offices.seats s ON s.batch_id=e.batch_id AND s.id=e.seat_id WHERE d.batch_id=c.batch_id AND i.group_code=c.group_code AND s.state=c.state)`, [id]);
  for (const row of contradictory.rows) problems.push(`coverage contradicts included endorsement: ${row.state}/${row.group_code}`);
  const invalid = await db.query(`SELECT t.id FROM state_offices.terms t
    LEFT JOIN state_offices.elections e ON e.batch_id=t.batch_id AND e.id=t.election_id
    WHERE t.batch_id=$1 AND t.status IN ('serving','incoming','unresolved') AND
      ((t.status='serving' AND (t.starts_on > CURRENT_DATE OR t.ends_on <= CURRENT_DATE OR t.service_source_id IS NULL))
      OR (t.status='incoming' AND t.starts_on <= CURRENT_DATE)
      OR e.id IS NULL OR e.stage NOT IN ('general','special') OR e.seat_id <> t.seat_id OR t.result_source_id IS NULL OR (t.contact_url IS NULL AND t.campaign_url IS NULL)
      OR NOT EXISTS (SELECT 1 FROM state_offices.endorsements d JOIN state_offices.elections de ON de.batch_id=d.batch_id AND de.id=d.election_id
        JOIN state_offices.reconciliations r ON r.batch_id=d.batch_id AND r.endorsement_id=d.id AND r.outcome='included' AND r.term_id=t.id
        WHERE d.batch_id=t.batch_id AND d.person_id=t.person_id AND NOT d.withdrawn AND de.seat_id=t.seat_id AND de.year=e.year AND (de.id=e.id OR (de.stage='primary' AND de.cycle_election_id=e.id))))`, [id]);
  for (const row of invalid.rows) problems.push(`term requires reconciliation: ${row.id}`);
  const issuers = await db.query(`SELECT i.id FROM state_offices.issuers i JOIN state_offices.issuers p ON p.batch_id=i.batch_id AND p.id=i.parent_id
    WHERE i.batch_id=$1 AND (i.id=p.id OR i.group_code<>p.group_code OR p.parent_id IS NOT NULL)`, [id]);
  for (const row of issuers.rows) problems.push(`invalid issuer affiliation: ${row.id}`);
  const rfs = await db.query(`SELECT d.id FROM state_offices.endorsements d JOIN state_offices.issuers i ON i.batch_id=d.batch_id AND i.id=d.issuer_id
    JOIN state_offices.elections e ON e.batch_id=d.batch_id AND e.id=d.election_id JOIN state_offices.seats s ON s.batch_id=e.batch_id AND s.id=e.seat_id
    WHERE d.batch_id=$1 AND i.group_code='rfs' AND s.office='governor'`, [id]);
  for (const row of rfs.rows) problems.push(`RFS does not endorse governors: ${row.id}`);
  const unreconciled = await db.query(`SELECT d.id FROM state_offices.endorsements d LEFT JOIN state_offices.reconciliations r ON r.batch_id=d.batch_id AND r.endorsement_id=d.id
    LEFT JOIN state_offices.terms t ON t.batch_id=r.batch_id AND t.id=r.term_id
    LEFT JOIN state_offices.elections te ON te.batch_id=t.batch_id AND te.id=t.election_id
    JOIN state_offices.elections de ON de.batch_id=d.batch_id AND de.id=d.election_id
    WHERE d.batch_id=$1 AND (r.id IS NULL OR r.outcome='unresolved' OR (r.outcome='included' AND
      (d.withdrawn OR t.person_id<>d.person_id OR t.status NOT IN ('serving','incoming','unresolved') OR te.seat_id<>de.seat_id OR te.year<>de.year OR NOT (de.id=te.id OR (de.stage='primary' AND de.cycle_election_id=te.id)))))`, [id]);
  for (const row of unreconciled.rows) problems.push(`endorsement requires reconciliation: ${row.id}`);
  const overlap = await db.query(`SELECT a.seat_id FROM state_offices.terms a JOIN state_offices.seats s ON s.batch_id=a.batch_id AND s.id=a.seat_id
    JOIN state_offices.terms b ON b.batch_id=a.batch_id AND b.seat_id=a.seat_id AND b.status='serving'
      AND daterange(b.starts_on,b.ends_on,'[)') @> a.starts_on
    WHERE a.batch_id=$1 AND a.status='serving' GROUP BY a.id, a.seat_id, s.capacity HAVING count(*) > s.capacity`, [id]);
  for (const row of overlap.rows) problems.push(`seat capacity exceeded: ${row.seat_id}`);
  return problems;
}
export async function publishInTransaction(tx: Client, id: string, version: string) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(version)) throw new Error("invalid publication version");
    await tx.query("SELECT pg_advisory_xact_lock($1)", [MIGRATION_LOCK]);
    const problems = await publicationProblems(tx, id);
    if (problems.length) throw new Error(problems.join("\n"));
    const batch = (await tx.query("SELECT id, content_hash, imported_at, reviewed_at, reviewer, review_hash FROM state_offices.batches WHERE id=$1", [id])).rows[0];
    const contents = await batchContents(tx, id);
    if (hash(canonical(contents)) !== batch.review_hash) throw new Error("reviewed batch content changed");
    const snapshot: Record<string, unknown> = { version, batch, ...contents };
    const content = canonical(snapshot);
    await tx.query("INSERT INTO state_offices.publications (version,batch_id,snapshot,content_hash) VALUES ($1,$2,$3::jsonb,$4)", [version, id, content, hash(content)]);
}
async function publish(db: Client, id: string, version: string) {
  await transaction(db, (tx) => publishInTransaction(tx, id, version));
}
async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    if (command === "migrate" && !args.length) await migrate(db, "state_offices", "db/state-offices");
    else if (command === "import" && args.length === 1) await importBatch(db, args[0]);
    else if (command === "review" && args.length === 2) await review(db, args[0], args[1]);
    else if (command === "show" && args.length === 1) {
      const batch = await db.query("SELECT * FROM state_offices.batches WHERE id=$1", [args[0]]);
      if (!batch.rowCount) throw new Error("batch not found");
      console.log(JSON.stringify({ batch: batch.rows[0], ...await batchContents(db, args[0]) }, null, 2));
    }
    else if (command === "draft" && args.length === 2) {
      const existing = await db.query("SELECT id FROM state_offices.batches WHERE id=$1", [args[0]]);
      if (!existing.rowCount) throw new Error("batch not found");
      const contents = await batchContents(db, args[0]);
      const draft = Object.fromEntries(names.map((name) => [name, (contents[name] as Record<string, unknown>[]).map((row) => Object.fromEntries((tables[name] as readonly string[]).map((key) => [key, row[key]])))]));
      await writeFile(args[1], JSON.stringify(draft, null, 2) + "\n", { flag: "wx" });
    }
    else if (command === "check" && args.length === 1) { const problems = await publicationProblems(db, args[0]); if (problems.length) throw new Error(problems.join("\n")); console.log("Ready for publication"); }
    else if (command === "publish" && args.length === 3 && args[2] === "--confirm-gaps") await publish(db, args[0], args[1]);
    else if (command === "select" && args.length === 1) await db.query("INSERT INTO state_offices.selected_publication (version) VALUES ($1) ON CONFLICT (singleton) DO UPDATE SET version=EXCLUDED.version", [args[0]]);
    else if (command === "export" && args.length === 2) {
      const result = await db.query("SELECT snapshot, content_hash FROM state_offices.publications WHERE version=$1", [args[0]]);
      if (!result.rowCount) throw new Error("publication not found");
      const content = canonical(result.rows[0].snapshot);
      if (hash(content) !== result.rows[0].content_hash) throw new Error("publication hash mismatch");
      await writeFile(args[1], JSON.stringify({ version: args[0], sha256: result.rows[0].content_hash, snapshot: result.rows[0].snapshot }, null, 2) + "\n", { flag: "wx" });
    } else throw new Error("usage: state-offices migrate | import FILE | show BATCH | draft BATCH FILE | review BATCH REVIEWER | check BATCH | publish BATCH VERSION --confirm-gaps | select VERSION | export VERSION FILE");
  } finally { await db.end(); }
}
if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
