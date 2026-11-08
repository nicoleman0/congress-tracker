// Runs before `next build` so stale race results can't ship quietly.
// Old endorsements are only warned about: there is no election to resolve.
// Set ALLOW_STALE_DATA=1 to deploy an urgent fix anyway.
import { allMembers, STALE_AFTER_DAYS, staleMembers } from "@/lib/data";
import { ENDORSEMENT_STALE_AFTER_DAYS, endorsementFile, staleEndorsements } from "@/lib/endorsements";

const stale = staleMembers(allMembers(), new Date());
if (stale.length && process.env.ALLOW_STALE_DATA !== "1") {
  console.error(`${stale.length} unresolved races not checked in ${STALE_AFTER_DAYS} days:`);
  for (const m of stale) console.error(`  ${m.id} (last checked ${m.checkedAt})`);
  process.exit(1);
}
const old = staleEndorsements(endorsementFile(), new Date());
for (const e of old) console.warn(`warning: ${e.id} ${e.group} endorsement not checked in ${ENDORSEMENT_STALE_AFTER_DAYS} days (${e.checkedAt})`);
console.log(`Freshness OK: ${stale.length} stale${stale.length ? " (ALLOW_STALE_DATA=1)" : ""}.`);
