import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { Client } from "pg";
import { STATES } from "../lib/states";
import { batchContents, publicationProblems, publishInTransaction } from "../scripts/state-offices";
import { canonical } from "../lib/canonical";
import { migrate } from "../scripts/db";

const url = process.env.STATE_TEST_DATABASE_URL;
test("database gates reconciliation and multi-member seat capacity", { skip: !url }, async () => {
  const db = new Client({ connectionString: url });
  const batch = `test-${randomUUID()}`;
  await db.connect();
  try {
    await migrate(db, "state_offices", "db/state-offices");
    await db.query("BEGIN");
    await db.query("INSERT INTO state_offices.batches(id, content_hash) VALUES($1,$1)", [batch]);
    await db.query("INSERT INTO state_offices.people(batch_id,id,name) VALUES($1,'a','Person A'),($1,'b','Person B'),($1,'c','Person C')", [batch]);
    await db.query("INSERT INTO state_offices.seats(batch_id,id,state,office,chamber,district,capacity) VALUES($1,'seat','AZ','lower','House','26',2)", [batch]);
    await db.query("INSERT INTO state_offices.sources(batch_id,id,url,label,checked_at) VALUES($1,'source','https://example.org/','Test','2026-01-01')", [batch]);
    await db.query("INSERT INTO state_offices.elections(batch_id,id,seat_id,year,stage) VALUES($1,'election','seat',2024,'general')", [batch]);
    await db.query("INSERT INTO state_offices.elections(batch_id,id,seat_id,year,stage,cycle_election_id) VALUES($1,'primary','seat',2024,'primary','election')", [batch]);
    await db.query("INSERT INTO state_offices.elections(batch_id,id,seat_id,year,stage) VALUES($1,'other-election','seat',2024,'special')", [batch]);
    await db.query("INSERT INTO state_offices.issuers(batch_id,id,name,group_code) VALUES($1,'issuer','Test chapter','dsa')", [batch]);
    for (const id of ["a", "b", "c"]) {
      await db.query("INSERT INTO state_offices.terms(batch_id,id,person_id,seat_id,election_id,starts_on,ends_on,status,service_source_id,result_source_id,contact_url,contact_source_id) VALUES($1,$2,$2,'seat','election','2025-01-01','2099-01-01','serving','source','source','https://example.org/','source')", [batch, id]);
      await db.query("INSERT INTO state_offices.endorsements(batch_id,id,person_id,issuer_id,election_id,source_id,withdrawn) VALUES($1,$2,$2,'issuer','election','source',false)", [batch, id]);
      await db.query("INSERT INTO state_offices.reconciliations(batch_id,id,endorsement_id,outcome,reason,term_id) VALUES($1,$2,$2,'included','Test evidence',$2)", [batch, id]);
    }
    await db.query("UPDATE state_offices.endorsements SET election_id='primary' WHERE batch_id=$1 AND id='a'", [batch]);
    const coverage = STATES.filter((s) => s.code !== "DC").flatMap((s) => ["wfp", "or", "dsa", "rfs", "pccc", "sunrise"].map((group_code) => ({ state: s.code, group_code })));
    await db.query("INSERT INTO state_offices.coverage(batch_id,state,group_code,status,note,checked_at) SELECT $1,state,group_code,CASE WHEN state='AZ' AND group_code='dsa' THEN 'complete_with_entries' ELSE 'complete_no_entries' END,'synthetic','2026-01-01' FROM jsonb_to_recordset($2::jsonb) AS c(state text,group_code text)", [batch, JSON.stringify(coverage)]);
    assert.ok((await publicationProblems(db, batch)).some((p) => p.includes("seat capacity exceeded")));
    await db.query("UPDATE state_offices.terms SET status='ended' WHERE batch_id=$1 AND id='c'", [batch]);
    await db.query("UPDATE state_offices.reconciliations SET outcome='excluded',term_id=NULL,reason='Test exclusion' WHERE batch_id=$1 AND id='c'", [batch]);
    assert.ok(!(await publicationProblems(db, batch)).some((p) => p.includes("seat capacity exceeded")));
    await db.query("UPDATE state_offices.elections SET cycle_election_id='other-election' WHERE batch_id=$1 AND id='primary'", [batch]);
    assert.ok((await publicationProblems(db, batch)).some((p) => p.includes("term requires reconciliation: a")));
    await db.query("UPDATE state_offices.elections SET cycle_election_id='election' WHERE batch_id=$1 AND id='primary'", [batch]);
    await db.query("UPDATE state_offices.terms SET status='incoming',starts_on='2090-01-01' WHERE batch_id=$1 AND id='c'", [batch]);
    await db.query("UPDATE state_offices.reconciliations SET outcome='included',term_id='c' WHERE batch_id=$1 AND id='c'", [batch]);
    assert.ok(!(await publicationProblems(db, batch)).some((p) => p.includes("term requires reconciliation: c")));
    await db.query("UPDATE state_offices.terms SET status='ended',starts_on='2025-01-01' WHERE batch_id=$1 AND id='c'", [batch]);
    await db.query("UPDATE state_offices.reconciliations SET outcome='excluded',term_id=NULL WHERE batch_id=$1 AND id='c'", [batch]);
    await db.query("UPDATE state_offices.terms SET status='unresolved' WHERE batch_id=$1 AND id='b'", [batch]);
    // Uncalled races are hidden on the site, so an old result check no longer blocks publication.
    assert.ok(!(await publicationProblems(db, batch)).some((p) => p.includes("term requires reconciliation: b")));
    await db.query("UPDATE state_offices.terms SET status='serving' WHERE batch_id=$1 AND id='b'", [batch]);
    const reviewHash = createHash("sha256").update(canonical(await batchContents(db, batch))).digest("hex");
    await db.query("UPDATE state_offices.batches SET reviewed_at=now(),reviewer='Test',review_hash=$2 WHERE id=$1", [batch, reviewHash]);
    assert.deepEqual(await publicationProblems(db, batch), []);
    const first = `${batch}-one`, second = `${batch}-two`;
    await publishInTransaction(db, batch, first);
    const original = (await db.query("SELECT snapshot,content_hash FROM state_offices.publications WHERE version=$1", [first])).rows[0];
    assert.equal(createHash("sha256").update(canonical(original.snapshot)).digest("hex"), original.content_hash);
    await db.query("INSERT INTO state_offices.batches(id,content_hash) VALUES($1,$1)", [`${batch}-pending`]);
    await assert.rejects(publishInTransaction(db, `${batch}-pending`, `${batch}-invalid`), /unreviewed/);
    assert.deepEqual((await db.query("SELECT snapshot,content_hash FROM state_offices.publications WHERE version=$1", [first])).rows[0], original);
    await publishInTransaction(db, batch, second);
    await db.query("INSERT INTO state_offices.selected_publication(version) VALUES($1) ON CONFLICT(singleton) DO UPDATE SET version=EXCLUDED.version", [second]);
    await db.query("UPDATE state_offices.selected_publication SET version=$1", [first]);
    assert.equal((await db.query("SELECT version FROM state_offices.selected_publication")).rows[0].version, first);
    await db.query("SAVEPOINT reviewed");
    await assert.rejects(db.query("UPDATE state_offices.people SET name='changed' WHERE batch_id=$1", [batch]), /immutable/);
    await db.query("ROLLBACK TO SAVEPOINT reviewed");
  } finally {
    await db.query("ROLLBACK");
    await db.end();
  }
});
