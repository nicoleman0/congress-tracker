// Runs before `next build` so stale race results can't ship quietly.
// Set ALLOW_STALE_DATA=1 to deploy an urgent fix anyway.
import { allMembers, STALE_AFTER_DAYS, staleMembers } from "@/lib/data";

const stale = staleMembers(allMembers(), new Date());
if (stale.length && process.env.ALLOW_STALE_DATA !== "1") {
  console.error(`${stale.length} unresolved races not checked in ${STALE_AFTER_DAYS} days:`);
  for (const m of stale) console.error(`  ${m.id} (last checked ${m.checkedAt})`);
  process.exit(1);
}
console.log(`Freshness OK: ${stale.length} stale${stale.length ? " (ALLOW_STALE_DATA=1)" : ""}.`);
