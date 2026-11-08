// Saves Open States' current-legislator CSVs (CC0) as service and contact evidence for state research.
// Members appear once seated, so incoming members are missing until their term starts.
// Usage: tsx scripts/openstates.ts
import fs from "node:fs";
import { STATES } from "@/lib/states";

const DIR = "research_notes/openstates";
const url = (code: string) => `https://data.openstates.org/people/current/${code.toLowerCase()}.csv`;

// The host drops the odd connection; retry twice before failing.
async function download(code: string): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url(code), { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (attempt === 3) throw new Error(`${code}: ${(e as Error).message} (${(e as Error).cause ?? "no cause"})`);
      await new Promise((r) => setTimeout(r, 2_000 * attempt));
    }
  }
}

async function main() {
  fs.mkdirSync(DIR, { recursive: true });
  const fetched: Record<string, { url: string; rows: number }> = {};
  for (const s of STATES.filter((s) => s.code !== "DC")) {
    const text = await download(s.code);
    if (!text.startsWith("id,name,")) throw new Error(`${s.code}: unexpected CSV header`);
    fs.writeFileSync(`${DIR}/${s.code}.csv`, text);
    fetched[s.code] = { url: url(s.code), rows: text.trim().split("\n").length - 1 };
  }
  const manifest = { fetched_at: new Date().toISOString(), license: "CC0 (https://openstates.org/data/)", states: fetched };
  fs.writeFileSync(`${DIR}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
  console.log(Object.entries(fetched).map(([k, v]) => `${k} ${v.rows}`).join(" "));
}

main().catch((e) => { console.error(e.message); process.exit(1); });
