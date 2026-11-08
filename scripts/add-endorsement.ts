// Adds or updates one endorsement in data/endorsements-2028.json after you have read the group's page.
// Usage: tsx scripts/add-endorsement.ts <group> <id> <url> [--name N --office house|senate --state XX
//        --district D --seat open|incumbent|challenger --member ID --note TEXT]
// A new candidate needs --name, --office, --state and --seat (--district for House).
import fs from "node:fs";
import { parseArgs } from "node:util";
import type { Office } from "@/lib/data";
import { validateEndorsements, type Candidate, type EndorsementFile, type Seat } from "@/lib/endorsements";

export const FILE = "data/endorsements-2028.json";

export function upsert(file: EndorsementFile, group: string, id: string, url: string, today: string, c: Partial<Candidate>) {
  let cand = file.candidates.find((x) => x.id === id);
  if (!cand) {
    cand = { id, name: "", office: "house", state: "", district: null, seat: "open", note: "", endorsements: [] };
    file.candidates.push(cand);
  }
  Object.assign(cand, Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined)));
  const e = cand.endorsements.find((x) => x.group === group);
  if (e) Object.assign(e, { url, checkedAt: today });
  else cand.endorsements.push({ group, url, checkedAt: today });
  file.candidates.sort((a, b) => a.id.localeCompare(b.id));
  return file;
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      name: { type: "string" }, office: { type: "string" }, state: { type: "string" }, district: { type: "string" },
      seat: { type: "string" }, member: { type: "string" }, note: { type: "string" },
    },
  });
  const [group, id, url] = positionals;
  if (!group || !id || !url) throw new Error("usage: add-endorsement.ts <group> <id> <url> [options]");
  const file = JSON.parse(fs.readFileSync(FILE, "utf8")) as EndorsementFile;
  const office = values.office as Office | undefined;
  upsert(file, group, id, url, new Date().toISOString().slice(0, 10), {
    name: values.name, office, state: values.state, seat: values.seat as Seat | undefined,
    district: values.district ?? (office === "senate" ? null : undefined), memberId: values.member, note: values.note,
  });
  const groups = new Set(Object.keys((JSON.parse(fs.readFileSync("data/members.json", "utf8")) as { groups: object }).groups));
  validateEndorsements(file, groups);
  fs.writeFileSync(FILE, JSON.stringify(file, null, 2) + "\n");
  console.log(`${id}: ${group} recorded.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try { main(); } catch (e) { console.error((e as Error).message); process.exit(1); }
}
