// Standing actions built from a member's fields. Outbound tools are linked, not rebuilt.
import type { Member } from "@/lib/data";

export type Action = { label: string; href: string; detail?: string };

export const PLUG_IN: Action[] = [
  { label: "Find a local Indivisible group", href: "https://indivisible.org/get-involved/find-a-group/" },
  { label: "Find events on Mobilize", href: "https://www.mobilize.us/" },
  { label: "Call with 5 Calls", href: "https://5calls.org/" },
];

// For states with no listed member: build the opposition to Republicans there.
export const OPPOSE: Action[] = [
  { label: "Help Democrats win close races with Swing Left", href: "https://swingleft.org/" },
  { label: "Register Democratic voters with Field Team 6", href: "https://www.fieldteam6.org/" },
  { label: "Run for office with Run for Something", href: "https://runforsomething.net/" },
];

export const CONTACT_HOUSE: Action = {
  label: "Find and contact your representative",
  href: "https://www.house.gov/representatives/find-your-representative",
  detail: "New members appear after January 3, 2027.",
};

export const CONTACT_SENATE: Action = {
  label: "Contact your senators",
  href: "https://www.senate.gov/senators/senators-contact.htm",
};

// The member page's one action: their own campaign site when the FEC has it, otherwise a search.
export function campaignAction(m: Member): Action {
  if (m.campaign) {
    return { label: "Donate or volunteer", href: m.campaign.url };
  }
  const office = m.office === "senate" ? "Senate" : "Congress";
  return {
    label: "Search for their campaign",
    href: `https://duckduckgo.com/?q=${encodeURIComponent(`${m.name} for ${office} campaign`)}`,
  };
}
