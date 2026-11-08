import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionList, StatusBadge } from "@/components/ui";
import { CONTACT_HOUSE, CONTACT_SENATE, PLUG_IN, helpActions } from "@/lib/actions";
import { allMembers, getGroup, getMember, getState, seatLabel } from "@/lib/data";

export function generateStaticParams() {
  return allMembers().map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: PageProps<"/member/[id]">) {
  const m = getMember((await params).id);
  return { title: m ? `${m.name} · Progressive Bloc` : "Not found" };
}

// Every real path is prerendered, so blocking costs nothing. proxy.ts 404s unknown ids.
export const instant = false;

export default async function MemberPage({ params }: PageProps<"/member/[id]">) {
  const m = getMember((await params).id);
  if (!m) notFound();
  const state = getState(m.state)!;

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <Link href={`/state/${m.state.toLowerCase()}`} className="text-sm text-muted underline">
          {state.name}
        </Link>
        <h1 className="text-3xl font-bold mt-2">{m.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-muted">
          <span>{seatLabel(m)}</span>
          <StatusBadge status={m.status} />
          {!m.incumbent && <span className="text-sm">New member</span>}
        </div>
        <p className="mt-3">{m.note}</p>
        <p className="mt-1 text-sm text-muted">
          Source:{" "}
          <a href={m.source.url} target="_blank" rel="noopener noreferrer" className="underline">
            {m.source.label}
          </a>
          {" · "}Last checked {m.checkedAt}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Why they&apos;re listed</h2>
        <ul className="list-disc pl-5">
          {m.endorsedBy.map((c) => {
            const g = getGroup(c);
            return (
              <li key={c}>
                <a href={g.url} target="_blank" rel="noopener noreferrer" className="underline">{g.name}</a>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How to back them</h2>
        <ActionList actions={helpActions(m)} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Contact and plug in</h2>
        <ActionList actions={[m.office === "senate" ? CONTACT_SENATE : CONTACT_HOUSE, ...PLUG_IN]} />
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Platform and record</h2>
        <p className="text-muted">
          Platform positions are coming soon. Once members are seated in January, this section will
          compare their votes with what they campaigned on.
        </p>
      </section>
    </div>
  );
}
