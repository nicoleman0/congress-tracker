// Counts derived from the roster and platform, for the data page.
import { listedMembers, platformOf, type Member, type Office } from "@/lib/data";

export const SEATS: Record<Office, { total: number; majority: number }> = {
  house: { total: 435, majority: 218 },
  senate: { total: 100, majority: 51 },
};

export type Bloc = { office: Office; seated: number; returning: number; new: number; unresolved: number };

// "Seated" is won plus senators not up in 2026. Leading and not-called races are counted apart.
export function blocSize(members: Member[] = listedMembers()): Bloc[] {
  return (["house", "senate"] as Office[]).map((office) => {
    const here = members.filter((m) => m.office === office);
    const seated = here.filter((m) => m.status === "won" || m.status === "incumbent");
    return {
      office,
      seated: seated.length,
      returning: seated.filter((m) => m.incumbent).length,
      new: seated.filter((m) => !m.incumbent).length,
      unresolved: here.filter((m) => m.status === "leading" || m.status === "pending").length,
    };
  });
}

export type Coverage = { issue: string; name: string; members: Member[]; onRecord: Member[] };

// For each issue, the listed members with a sourced position on it, and those with a bill record on it.
export function issueCoverage(members: Member[] = listedMembers(), platform = platformOf): Coverage[] {
  const by = new Map<string, Coverage>();
  for (const m of members) {
    for (const g of platform(m.id)) {
      const c = by.get(g.issue) ?? { issue: g.issue, name: g.name, members: [], onRecord: [] };
      c.members.push(m);
      if (g.stances.some((s) => s.kind === "congress")) c.onRecord.push(m);
      by.set(g.issue, c);
    }
  }
  return [...by.values()].sort((a, b) => b.members.length - a.members.length);
}
