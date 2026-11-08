import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MemberNews } from "@/components/MemberNews";
import { ActionList, STATUS_TEXT } from "@/components/ui";
import { CONTACT_HOUSE, CONTACT_SENATE, PLUG_IN, campaignAction } from "@/lib/actions";
import { allMembers, getGroup, getMember, getState, seatLabel } from "@/lib/data";

export function generateStaticParams() {
  return allMembers().map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: PageProps<"/member/[id]">) {
  const m = getMember((await params).id);
  return { title: m ? m.name : "Not found" };
}

// Every real path is prerendered, so blocking costs nothing. proxy.ts 404s unknown ids.
export const instant = false;

export default async function MemberPage({ params }: PageProps<"/member/[id]">) {
  const m = getMember((await params).id);
  if (!m) notFound();
  const state = getState(m.state)!;
  const campaign = campaignAction(m);

  return (
    <>
      <section className="hero" aria-labelledby="member-name">
        <Link href={`/state/${m.state.toLowerCase()}`} className="crumb">{state.name}</Link>
        <div className="hero-id">
          <h1 id="member-name" className="hero-title"><span className="ink">{m.name}</span></h1>
          <div className="hero-card">
            <p className="hero-role">{seatLabel(m)}</p>
            <p className="hero-detail">
              {STATUS_TEXT[m.status]}
              {!m.incumbent && " · New member"}
            </p>
            <a className="hero-action" href={campaign.href} target="_blank" rel="noopener noreferrer">
              {campaign.label} ↗
            </a>
          </div>
        </div>
      </section>

      <div className="page-header">
        <p className="lede">{m.note}</p>
        <p className="meta">
          Source:{" "}
          <a href={m.source.url} target="_blank" rel="noopener noreferrer">{m.source.label}</a>
          {" · "}Last checked {m.checkedAt}
        </p>
      </div>

      <section className="section" aria-labelledby="news-title">
        <h2 id="news-title">In the news</h2>
        <Suspense fallback={<p className="note">Loading headlines…</p>}>
          <MemberNews m={m} />
        </Suspense>
      </section>

      <section className="section" aria-labelledby="why-title">
        <h2 id="why-title">Why they&apos;re listed</h2>
        <ul className="list">
          {m.endorsedBy.map((c) => {
            const g = getGroup(c);
            return (
              <li key={c}>
                <a href={g.url} target="_blank" rel="noopener noreferrer">{g.name}</a>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="section" aria-labelledby="plug-in-title">
        <h2 id="plug-in-title">Contact and plug in</h2>
        <ActionList actions={[m.office === "senate" ? CONTACT_SENATE : CONTACT_HOUSE, ...PLUG_IN]} />
      </section>

      <section className="section" aria-labelledby="record-title">
        <h2 id="record-title">Platform and record</h2>
        <p className="note">Platform positions coming soon.</p>
      </section>
    </>
  );
}
