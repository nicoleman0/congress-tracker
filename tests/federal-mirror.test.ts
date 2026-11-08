import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { Client } from "pg";
import { FILES, loadInto, migrateAll, rows, type MirrorInput } from "../scripts/federal-mirror";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const committed = (): MirrorInput => ({ members: read(FILES[0]), platform: read(FILES[1]), photos: read(FILES[2]), endorsements: [read(FILES[3])] });

test("mirror rows cover every record in the committed JSON", () => {
  const input = committed();
  const r = rows(input);
  assert.equal(r.members.length, input.members.members.length);
  assert.equal(r.member_groups.length, input.members.members.reduce((n, m) => n + m.endorsedBy.length, 0));
  assert.equal(r.stances.length, Object.values(input.platform.stances).flat().length);
  assert.equal(r.photos.length, Object.keys(input.photos).length);
});

test("an unmirrored field fails instead of being dropped", () => {
  const input = committed();
  (input.members.members[0] as unknown as Record<string, unknown>).twitter = "x";
  assert.throws(() => rows(input), /field twitter is not mirrored/);
});

// Mirror rows are immutable, so this runs in a throwaway database it creates and drops.
const url = process.env.STATE_TEST_DATABASE_URL;
test("loads dedupe by content, syncs track commits, and views join both levels", { skip: !url }, async () => {
  const name = `mirror_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Client({ connectionString: url });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${name}`);
  const testUrl = new URL(url!);
  testUrl.pathname = `/${name}`;
  const db = new Client({ connectionString: testUrl.toString() });
  try {
    await db.connect();
    await migrateAll(db);
    const one = committed();
    const two = committed();
    two.members.members[0].note = "changed";
    const [a, b, c] = ["a", "b", "c"].map((x) => x.repeat(40));

    const first = await loadInto(db, one, a);
    assert.deepEqual([first.created, first.synced], [true, true]);
    assert.deepEqual(await loadInto(db, one, a), { load: first.load, created: false, synced: false });
    const second = await loadInto(db, two, b);
    assert.ok(second.created && second.load !== first.load);
    await assert.rejects(loadInto(db, two, a), /already synced with different content/);
    // Reverting to earlier content reuses its load but still becomes latest.
    const reverted = await loadInto(db, one, c);
    assert.deepEqual([reverted.load, reverted.created, reverted.synced], [first.load, false, true]);
    assert.equal((await db.query("SELECT id FROM federal.latest")).rows[0].id, first.load);
    await assert.rejects(loadInto(db, one, "abc"), /not a full commit hash/);

    const count = async (table: string, load: string) => (await db.query(`SELECT count(*)::int AS n FROM federal.${table} WHERE load_id = $1`, [load])).rows[0].n;
    for (const [table, list] of Object.entries(rows(one))) assert.equal(await count(table, first.load), list.length, table);
    await assert.rejects(db.query("UPDATE federal.members SET name = 'x'"), /immutable/);

    // A selected state publication joins federal rows in the analysis views.
    await db.query("INSERT INTO state_offices.batches(id, content_hash) VALUES('t','t')");
    await db.query("INSERT INTO state_offices.people(batch_id,id,name) VALUES('t','p','State Person')");
    await db.query("INSERT INTO state_offices.seats(batch_id,id,state,office,chamber,district) VALUES('t','s','AZ','lower','House','26')");
    await db.query("INSERT INTO state_offices.sources(batch_id,id,url,label,checked_at) VALUES('t','src','https://example.org/','Test','2026-01-01')");
    await db.query("INSERT INTO state_offices.elections(batch_id,id,seat_id,year,stage) VALUES('t','e','s',2024,'general')");
    await db.query("INSERT INTO state_offices.terms(batch_id,id,person_id,seat_id,election_id,starts_on,status,service_source_id,result_source_id) VALUES('t','term','p','s','e','2025-01-01','serving','src','src')");
    await db.query("INSERT INTO state_offices.issuers(batch_id,id,name,group_code) VALUES('t','i','Test DSA','dsa')");
    await db.query("INSERT INTO state_offices.endorsements(batch_id,id,person_id,issuer_id,election_id,source_id) VALUES('t','en','p','i','e','src')");
    await db.query("INSERT INTO state_offices.reconciliations(batch_id,id,endorsement_id,outcome,reason,term_id) VALUES('t','r','en','included','Test','term')");
    assert.equal((await db.query("SELECT count(*)::int AS n FROM analysis.officeholders WHERE level = 'state'")).rows[0].n, 0, "unpublished batch stays out");
    await db.query("INSERT INTO state_offices.publications(version,batch_id,snapshot,content_hash) VALUES('v','t','{}','x')");
    await db.query("INSERT INTO state_offices.selected_publication(version) VALUES('v')");

    const levels = (await db.query("SELECT level, count(*)::int AS n FROM analysis.officeholders GROUP BY level ORDER BY level")).rows;
    assert.deepEqual(levels, [{ level: "federal", n: one.members.members.length }, { level: "state", n: 1 }]);
    assert.deepEqual((await db.query("SELECT groups FROM analysis.officeholders WHERE level = 'state'")).rows[0].groups, ["dsa"]);
    const endorsements = (await db.query("SELECT level, count(*)::int AS n FROM analysis.endorsements GROUP BY level ORDER BY level")).rows;
    assert.deepEqual(endorsements, [{ level: "federal", n: rows(one).member_groups.length }, { level: "state", n: 1 }]);
  } finally {
    await db.end().catch(() => {});
    await admin.query(`DROP DATABASE IF EXISTS ${name}`);
    await admin.end();
  }
});
