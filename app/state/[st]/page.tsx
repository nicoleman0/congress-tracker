import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionList, MemberList } from "@/components/ui";
import { CONTACT_HOUSE, CONTACT_SENATE, PLUG_IN } from "@/lib/actions";
import { districtsOf, getState, membersIn } from "@/lib/data";
import { STATES } from "@/lib/states";

export function generateStaticParams() {
  return STATES.map((s) => ({ st: s.code.toLowerCase() }));
}

export async function generateMetadata({ params }: PageProps<"/state/[st]">) {
  const state = getState((await params).st.toUpperCase());
  return { title: state ? `${state.name} · Progressive Bloc` : "Not found" };
}

function NoProgressive({ what }: { what: string }) {
  return (
    <p className="empty">
      No progressive {what} listed. Use the links under &ldquo;Oppose and plug in&rdquo; to reach your member
      and the groups organizing here.
    </p>
  );
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
  const listed = new Set(house.map((m) => m.district));
  const unlisted = districtsOf(state).filter((d) => !listed.has(d));

  return (
    <>
      <header className="page-header">
        <Link href="/#states" className="crumb">All states</Link>
        <h1>{state.name}</h1>
        <p className="meta">
          {house.length} progressive House {house.length === 1 ? "listing" : "listings"} across {state.seats}{" "}
          {state.seats === 1 ? "seat" : "seats"}.
        </p>
      </header>

      {state.senators && (
        <section className="section" aria-labelledby="senate-title">
          <h2 id="senate-title">Senate</h2>
          {senators.length ? <MemberList members={senators} /> : <NoProgressive what="senator" />}
        </section>
      )}

      <section className="section" aria-labelledby="house-title">
        <h2 id="house-title">House</h2>
        {house.length ? <MemberList members={house} /> : <NoProgressive what="House member" />}
        {unlisted.length > 0 && house.length > 0 && (
          <p className="note">
            No progressive listed in {unlisted.length === 1 ? "district" : "districts"} {unlisted.join(", ")}.
          </p>
        )}
        <p className="note">
          District numbers can shift: several states redrew their maps for 2026. Address lookup comes later.
        </p>
      </section>

      <section className="section" aria-labelledby="plug-in-title">
        <h2 id="plug-in-title">Oppose and plug in</h2>
        <p className="section-intro">
          If your member isn&apos;t listed above, contact them directly and join the people organizing near you.
        </p>
        <ActionList actions={[CONTACT_HOUSE, ...(state.senators ? [CONTACT_SENATE] : []), ...PLUG_IN]} />
      </section>
    </>
  );
}
