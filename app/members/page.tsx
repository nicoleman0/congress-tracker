import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { listedMembers, seatLabel, type Member } from "@/lib/data";
import { stateMembers, statePublicationVersion, stateSeatLabel } from "@/lib/state-offices";
import { STATES } from "@/lib/states";

export const metadata = { title: "All members" };
export const instant = false;
const stateOrder = new Map(STATES.map((s, i) => [s.code, i]));
const rank = (m: Member) => [stateOrder.get(m.state)!, m.office === "senate" ? -1 : Number(m.district) || 0];

export default async function Members({ searchParams }: PageProps<"/members">) {
  const requested = (await searchParams).office;
  const office = typeof requested === "string" && ["congress", "governor", "legislature"].includes(requested) && statePublicationVersion ? requested : "all";
  const members = listedMembers().sort((a, b) => {
    const [sa, da] = rank(a), [sb, db] = rank(b);
    return sa - sb || da - db;
  });
  const state = stateMembers().filter((m) => office === "all" || (office === "governor" ? m.seat.office === "governor" : office === "legislature" && m.seat.office !== "governor"));
  const confirmed = state.filter((m) => m.term.status !== "unresolved");
  const races = state.filter((m) => m.term.status === "unresolved");
  const federal = office === "all" || office === "congress" ? members : [];
  return <>
    <header className="page-header"><h1><span className="jd-ink">All members</span></h1><p className="jd-meta">{federal.length + confirmed.length} listed{races.length > 0 && ` · ${races.length} unresolved state races`}.</p></header>
    {statePublicationVersion && <nav aria-label="Filter by office"><ul className="list">{[["all", "All offices"], ["congress", "Congress"], ["governor", "Governors"], ["legislature", "State legislatures"]].map(([value, label]) => <li key={value}><Link href={value === "all" ? "/members" : `/members?office=${value}`} aria-current={office === value ? "page" : undefined}>{label}</Link></li>)}</ul></nav>}
    <ul className="roster jd-ruled">
      {federal.map((m) => <li key={m.id}><Link href={`/member/${m.id}`}>{m.name}</Link><span className="roster-seat jd-secondary">{seatLabel(m)}{m.status !== "won" && <> <StatusBadge status={m.status} /></>}</span></li>)}
      {confirmed.map((m) => <li key={m.term.id}><Link href={`/member/${m.id}`}>{m.name}</Link><span className="roster-seat jd-secondary">{stateSeatLabel(m)}{m.term.status === "incoming" && " · Incoming"}</span></li>)}
    </ul>
    {races.length > 0 && <section className="section" aria-labelledby="races-title"><h2 id="races-title">Unresolved state races</h2><ul className="roster jd-ruled">{races.map((m) => <li key={m.term.id}><Link href={`/member/${m.id}`}>{m.name}</Link><span className="roster-seat jd-secondary">{stateSeatLabel(m)} · Not called</span></li>)}</ul></section>}
  </>;
}
