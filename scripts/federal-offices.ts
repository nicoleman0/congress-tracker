import type { Member } from "@/lib/data";

export function assertFederalOffices(members: Member[]): void {
  for (const member of members) {
    if (member.office !== "house" && member.office !== "senate") {
      throw new Error(`${member.id}: unsupported federal office ${member.office}`);
    }
  }
}
