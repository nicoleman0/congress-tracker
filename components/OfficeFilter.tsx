"use client";

import { useRouter } from "next/navigation";

const OPTIONS = [["all", "All offices"], ["congress", "Congress"], ["governor", "Governors"], ["legislature", "State legislatures"]];

// Navigates on change; the submit button covers readers without JavaScript.
export function OfficeFilter({ office }: { office: string }) {
  const router = useRouter();
  return (
    <form className="jd-field office-filter" action="/members" method="get">
      <label className="jd-label" htmlFor="office">Office</label>
      <select className="jd-input" id="office" name="office" defaultValue={office}
        onChange={(e) => router.push(e.target.value === "all" ? "/members" : `/members?office=${e.target.value}`)}>
        {OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <noscript><button className="jd-button" type="submit">Filter</button></noscript>
    </form>
  );
}
