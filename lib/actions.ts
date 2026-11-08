// Standing actions built from a member's fields. Outbound tools are linked, not rebuilt.
import type { Member } from "@/lib/data";
import { getGroup } from "@/lib/data";

export type Action = { label: string; href: string; detail?: string };

export const PLUG_IN: Action[] = [
  { label: "Find a local Indivisible group", href: "https://indivisible.org/groups", detail: "Groups organize in every district." },
  { label: "Find events on Mobilize", href: "https://www.mobilize.us/", detail: "Rallies, canvasses, phone banks." },
  { label: "Call with 5 Calls", href: "https://5calls.org/", detail: "Scripts for current issues." },
];

export const CONTACT_HOUSE: Action = {
  label: "Find and contact your representative",
  href: "https://www.house.gov/representatives/find-your-representative",
  detail: "Official House lookup. New members appear after January 3, 2027.",
};

export const CONTACT_SENATE: Action = {
  label: "Contact your senators",
  href: "https://www.senate.gov/senators/senators-contact.htm",
};

export function helpActions(m: Member): Action[] {
  const office = m.office === "senate" ? "Senate" : "Congress";
  return [
    {
      label: "Find their campaign: donate or volunteer",
      href: `https://duckduckgo.com/?q=${encodeURIComponent(`${m.name} for ${office} campaign`)}`,
      detail: "We haven't verified campaign links yet, so this opens a search.",
    },
    ...m.endorsedBy.map((code) => {
      const g = getGroup(code);
      return { label: `See ${g.name}`, href: g.url };
    }),
  ];
}
