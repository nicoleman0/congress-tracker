import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ActionList, MemberCard } from "@/components/ui";
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
    <div className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">
      No progressive {what} listed. Use the links under &ldquo;Oppose and plug in&rdquo; to reach your
      member and the groups organizing here.
    </div>
  );
}

// Params are known at build time, but the shell must render before they resolve.
export default function StatePage({ params }: PageProps<"/state/[st]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/state/[st]">["params"] }) {
  const state = getState((await params).st.toUpperCase());
  if (!state) notFound();

  const members = membersIn(state.code);
  const senators = members.filter((m) => m.office === "senate");
  const house = members.filter((m) => m.office === "house");
  const listed = new Set(house.map((m) => m.district));
  const unlisted = districtsOf(state).filter((d) => !listed.has(d));

  return (
    <div className="space-y-10">
      <div>
        <Link href="/#states" className="text-sm text-muted underline">All states</Link>
        <h1 className="text-3xl font-bold mt-2">{state.name}</h1>
        <p className="text-muted">
          {house.length} progressive House {house.length === 1 ? "listing" : "listings"} across {state.seats}{" "}
          {state.seats === 1 ? "seat" : "seats"}.
        </p>
      </div>

      {state.senators && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Senate</h2>
          {senators.length ? (
            <div className="grid gap-3 sm:grid-cols-2">{senators.map((m) => <MemberCard key={m.id} m={m} />)}</div>
          ) : (
            <NoProgressive what="senator" />
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">House</h2>
        {house.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {house
              .sort((a, b) => Number(a.district) - Number(b.district))
              .map((m) => <MemberCard key={m.id} m={m} />)}
          </div>
        ) : (
          <NoProgressive what="House member" />
        )}
        {unlisted.length > 0 && house.length > 0 && (
          <p className="text-sm text-muted">
            No progressive listed in {unlisted.length === 1 ? "district" : "districts"}{" "}
            {unlisted.join(", ")}.
          </p>
        )}
        <p className="text-xs text-muted">
          District numbers can shift: several states redrew their maps for 2026. Address lookup comes later.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Oppose and plug in</h2>
        <p className="text-sm text-muted">
          If your member isn&apos;t listed above, contact them directly and join the people organizing near you.
        </p>
        <ActionList actions={[CONTACT_HOUSE, ...(state.senators ? [CONTACT_SENATE] : []), ...PLUG_IN]} />
      </section>
    </div>
  );
}
