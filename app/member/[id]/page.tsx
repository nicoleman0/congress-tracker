import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckedDate } from "@/components/CheckedDate";
import { MemberNews } from "@/components/MemberNews";
import { ActionList, STATUS_TEXT } from "@/components/ui";
import { CONTACT_HOUSE, CONTACT_SENATE, campaignAction, plugIn } from "@/lib/actions";
import { formatChecked } from "@/lib/freshness";
import { allMembers, getGroup, getMember, getPhoto, getState, platformOf, seatLabel } from "@/lib/data";
import { getStateMember, stateMembers } from "@/lib/state-offices";
import { moneyFile, spendingOn } from "@/lib/money";
import { OutsideMoney } from "@/components/OutsideMoney";
import { StateMemberProfile } from "@/components/StateMemberProfile";

export function generateStaticParams() {
  return [...new Set([...allMembers(), ...stateMembers()].map((m) => m.id))].map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/member/[id]">) {
  const id = (await params).id;
  const m = getMember(id) ?? getStateMember(id);
  return { title: m ? m.name : "Not found" };
}

// Every real path is prerendered, so blocking costs nothing. proxy.ts 404s unknown ids.
export const instant = false;

export default async function MemberPage({ params }: PageProps<"/member/[id]">) {
  const id = (await params).id;
  const stateMember = getStateMember(id);
  if (stateMember) return <StateMemberProfile member={stateMember} otherTerms={stateMembers().filter((m) => m.id === id && m.term.id !== stateMember.term.id)} stateName={getState(stateMember.state)!.name} />;
  const m = getMember(id);
  if (!m) notFound();
  const state = getState(m.state)!;
  const campaign = campaignAction(m);
  const platform = platformOf(m.id);
  const photo = getPhoto(m.id);
  const spends = spendingOn(m.id);

  return (
    <>
      <section className="hero" aria-labelledby="member-name">
        <Link href={`/state/${m.state.toLowerCase()}`} className="crumb">{state.name}</Link>
        <div className="hero-row">
          <div className="hero-id">
            <h1 id="member-name" className="hero-title"><span className="jd-ink">{m.name}</span></h1>
            <div className="hero-card jd-paper-sheet">
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
          {photo && (
            <figure className="hero-photo">
              <Image src={photo.src} width={photo.width} height={photo.height} alt={`Official portrait of ${m.name}`} sizes="10rem" preload />
              <figcaption>
                <a href={`https://bioguide.congress.gov/search/bio/${photo.bioguide}`} target="_blank" rel="noopener noreferrer">
                  {photo.credit}
                </a>
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      <div className="page-header">
        <p className="lede">{m.note}</p>
        <p className="jd-meta">
          Source:{" "}
          <a href={m.source.url} target="_blank" rel="noopener noreferrer">{m.source.label}</a>
          {" · "}Last checked {formatChecked(m.checkedAt)}
        </p>
      </div>

      <section className="section" aria-labelledby="news-title">
        <h2 id="news-title">In the news</h2>
        <Suspense fallback={<p className="jd-note">Loading headlines…</p>}>
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
        <h2 id="plug-in-title">Get involved</h2>
        <ActionList actions={[m.office === "senate" ? CONTACT_SENATE : CONTACT_HOUSE, ...plugIn()]} />
      </section>

      <section className="section" aria-labelledby="record-title">
        <h2 id="record-title">Platform and record</h2>
        {platform.length === 0 ? (
          <p className="jd-note">No sourced positions yet.</p>
        ) : (
          <>
            <p className="jd-note">
              <Link href="/method">How we source this</Link>.
            </p>
            <dl className="platform">
              {platform.map((g) => (
                <div key={g.issue} className="platform-issue jd-ruled-row">
                  <dt>{g.name}</dt>
                  {g.stances.map((s) => (
                    <dd key={s.source.url + s.text}>
                      {s.text}{" "}
                      <a href={s.source.url} target="_blank" rel="noopener noreferrer" className="platform-source">
                        {s.source.label} ↗
                      </a>{" "}
                      <CheckedDate date={s.checkedAt} />
                    </dd>
                  ))}
                </div>
              ))}
            </dl>
          </>
        )}
      </section>
      <section className="section" aria-labelledby="money-title">
        <h2 id="money-title">Outside money</h2>
        {moneyFile().missing.includes(m.id) ? (
          <p className="jd-note">We don&apos;t have an FEC committee on file for {m.name} yet.</p>
        ) : spends.length === 0 ? (
          <p className="jd-note">No outside spending for or against {m.name} reported to the FEC in {moneyFile().cycle}.</p>
        ) : (
          <OutsideMoney spends={spends} />
        )}
      </section>
    </>
  );
}
