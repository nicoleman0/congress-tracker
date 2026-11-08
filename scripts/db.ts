// Shared Postgres helpers for the Neon scripts.
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import type { Client } from "pg";

// One lock for every schema change and state publication, so they never interleave.
export const MIGRATION_LOCK = 73628412;
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function transaction<T>(db: Client, fn: (db: Client) => Promise<T>): Promise<T> {
  await db.query("BEGIN");
  try { const result = await fn(db); await db.query("COMMIT"); return result; }
  catch (e) { await db.query("ROLLBACK"); throw e; }
}

// Applies db/<dir>/NNN.sql in order. An applied file that later changes is an error, not a silent skip.
export async function migrate(db: Client, schema: string, dir: string) {
  const versions = (await readdir(dir)).filter((f) => /^\d{3}\.sql$/.test(f)).map((f) => f.slice(0, 3)).sort();
  await transaction(db, async (tx) => {
    await tx.query("SELECT pg_advisory_xact_lock($1)", [MIGRATION_LOCK]);
    await tx.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    await tx.query(`CREATE TABLE IF NOT EXISTS ${schema}.migrations (version text PRIMARY KEY, hash text NOT NULL)`);
    for (const version of versions) {
      const sql = await readFile(`${dir}/${version}.sql`, "utf8");
      const old = await tx.query(`SELECT hash FROM ${schema}.migrations WHERE version = $1`, [version]);
      if (old.rowCount) {
        if (old.rows[0].hash !== sha256(sql)) throw new Error(`${schema} migration ${version} differs from applied version`);
        continue;
      }
      await tx.query(sql);
      await tx.query(`INSERT INTO ${schema}.migrations VALUES ($1, $2)`, [version, sha256(sql)]);
    }
  });
}
