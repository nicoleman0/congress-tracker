import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionList, MemberList } from "@/components/ui";
import { CONTACT_HOUSE, CONTACT_SENATE, PLUG_IN } from "@/lib/actions";
import { getState, membersIn } from "@/lib/data";
import { STATES } from "@/lib/states";

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
  const senators = members.filter((m) => m.office === "senate");
  const house = members
    .filter((m) => m.office === "house")
    .sort((a, b) => Number(a.district) - Number(b.district));

  return (
    <>
      <header className="page-header">
        <Link href="/#states" className="crumb">All states</Link>
        <h1><span className="ink">{state.name}</span></h1>
        {house.length > 0 && (
          <p className="meta">
            {house.length} progressive House {house.length === 1 ? "listing" : "listings"} across {state.seats}{" "}
            {state.seats === 1 ? "seat" : "seats"}.
          </p>
        )}
      </header>

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
          <p className="note">Several states redrew their district maps for 2026.</p>
        </section>
      )}

      <section className="section" aria-labelledby="plug-in-title">
        <h2 id="plug-in-title">Get involved</h2>
        <ActionList actions={[CONTACT_HOUSE, ...(state.senators ? [CONTACT_SENATE] : []), ...PLUG_IN]} />
      </section>
    </>
  );
}
