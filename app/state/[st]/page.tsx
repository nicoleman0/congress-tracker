import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionList, MemberList } from "@/components/ui";
import { CONTACT_HOUSE, CONTACT_SENATE, OPPOSE, PLUG_IN } from "@/lib/actions";
import { getState, membersIn } from "@/lib/data";
import { STATES } from "@/lib/states";
import { formatChecked } from "@/lib/freshness";
import { coverageComplete, GROUP_NAMES, stateCoverage, stateMembers, statePublicationVersion, stateSeatLabel } from "@/lib/state-offices";

export function generateStaticParams() {
  return STATES.map((s) => ({ st: s.code.toLowerCase() }));
}

export async function generateMetadata({ params }: PageProps<"/state/[st]">) {
  const state = getState((await params).st.toUpperCase());
  return { title: state ? state.name : "Not found" };
}

// Every real path is prerendered, so blocking costs nothing. proxy.ts 404s unknown ids.
export const instant = false;

export default async function StatePage({ params }: PageProps<"/state/[st]">) {
  const state = getState((await params).st.toUpperCase());
  if (!state) notFound();

  const members = membersIn(state.code);
  const local = stateMembers().filter((m) => m.state === state.code);
  const governors = local.filter((m) => m.seat.office === "governor" && m.term.status !== "unresolved");
  const legislators = local.filter((m) => m.seat.office !== "governor" && m.term.status !== "unresolved");
  const races = local.filter((m) => m.term.status === "unresolved");
  const gaps = stateCoverage(state.code).filter((c) => !coverageComplete(c));
  const senators = members.filter((m) => m.office === "senate");
  const house = members
    .filter((m) => m.office === "house")
    .sort((a, b) => Number(a.district) - Number(b.district));

  return (
    <>
      <header className="page-header">
        <Link href="/#states" className="crumb">All states</Link>
        <h1><span className="jd-ink">{state.name}</span></h1>
        {house.length > 0 && (
          <p className="jd-meta">
            {house.length} progressive House {house.length === 1 ? "listing" : "listings"} across {state.seats}{" "}
            {state.seats === 1 ? "seat" : "seats"}.
          </p>
        )}
      </header>

      {statePublicationVersion && members.length > 0 && <h2 className="section-title">Congress</h2>}

      {senators.length > 0 && (
        <section className="section" aria-labelledby="senate-title">
          <h2 id="senate-title">Senate</h2>
          <MemberList members={senators} />
        </section>
      )}

      {house.length > 0 && (
        <section className="section" aria-labelledby="house-title">
          <h2 id="house-title">House</h2>
          <MemberList members={house} />
          <p className="jd-note">Several states redrew their district maps for 2026.</p>
        </section>
      )}

      {statePublicationVersion && governors.length > 0 && (
        <section className="section" aria-labelledby="governor-title">
          <h2 id="governor-title">Governor</h2>
          <ul className="roster jd-ruled">{governors.map((m) => <li key={m.term.id}><Link href={`/member/${m.id}`}>{m.name}</Link><span className="roster-seat jd-secondary">{stateSeatLabel(m)}{m.term.status === "incoming" && " · Incoming"}</span></li>)}</ul>
        </section>
      )}
      {statePublicationVersion && legislators.length > 0 && (
        <section className="section" aria-labelledby="legislature-title">
          <h2 id="legislature-title">State legislature</h2>
          <ul className="roster jd-ruled">{legislators.map((m) => <li key={m.term.id}><Link href={`/member/${m.id}`}>{m.name}</Link><span className="roster-seat jd-secondary">{stateSeatLabel(m)}{m.term.status === "incoming" && " · Incoming"}</span></li>)}</ul>
        </section>
      )}
      {statePublicationVersion && races.length > 0 && <section className="section" aria-labelledby="races-title"><h2 id="races-title">Unresolved state races</h2><ul className="roster jd-ruled">{races.map((m) => <li key={m.term.id}><Link href={`/member/${m.id}`}>{m.name}</Link><span className="roster-seat jd-secondary">{stateSeatLabel(m)} · Not called</span></li>)}</ul></section>}

      {statePublicationVersion && gaps.length > 0 && (
        <section className="section" aria-labelledby="gaps-title">
          <h2 id="gaps-title">Not fully checked</h2>
          <p className="jd-note">State-office endorsements from these groups may be missing here.</p>
          <ul className="roster jd-ruled">{gaps.map((c) => <li key={c.group_code}>{GROUP_NAMES[c.group_code]}<span className="roster-seat jd-secondary">{c.status === "blocked" ? "Some sources could not be checked." : "Not yet researched."} As of {formatChecked(c.checked_at)}.</span></li>)}</ul>
        </section>
      )}

      {members.length === 0 && local.length === 0 && (
        <section className="section" aria-labelledby="oppose-title">
          <h2 id="oppose-title">Oppose Republicans here</h2>
          <ActionList actions={OPPOSE} />
          <p className="jd-note">
            Or back a progressive in another state: <Link href="/members">all members</Link>.
          </p>
        </section>
      )}

      <section className="section" aria-labelledby="plug-in-title">
        <h2 id="plug-in-title">Get involved</h2>
        <ActionList actions={[CONTACT_HOUSE, ...(state.senators ? [CONTACT_SENATE] : []), ...PLUG_IN]} />
      </section>
    </>
  );
}
