import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { NewsPager } from "@/components/NewsPager";
import { formatChecked } from "@/lib/freshness";
import { aboutMember, parseRss, stateNewsUrl } from "@/lib/news";
import { USER_AGENT } from "@/lib/site";
import { stateSeatLabel, type StateMember, type StateSource } from "@/lib/state-offices";

function Evidence({ source }: { source: StateSource }) {
  return <><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a> · checked {formatChecked(source.checked_at.slice(0, 10))}</>;
}
async function getStateNews(member: StateMember, stateName: string) {
  "use cache";
  try {
    const res = await fetch(stateNewsUrl({ name: member.name, stateName, chamber: member.seat.chamber }), { headers: { "user-agent": USER_AGENT } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const headlines = aboutMember(member, parseRss(await res.text()));
    cacheLife("hours");
    return { headlines };
  } catch (error) {
    console.error(`news for ${member.id}: ${(error as Error).message}`);
    cacheLife("minutes");
    return { error: true };
  }
}
async function StateNews({ member, stateName }: { member: StateMember; stateName: string }) {
  const news = await getStateNews(member, stateName);
  if ("error" in news) return <p className="empty">Couldn&apos;t load headlines right now.</p>;
  if (!news.headlines.length) return <p className="empty">No headlines in the last 90 days.</p>;
  return <><NewsPager headlines={news.headlines} /><p className="note">Headlines from Google News, filtered by name.</p></>;
}
const status = (member: StateMember) => member.term.status === "serving" ? `Serving · term began ${member.term.starts_on.slice(0, 10)}` : member.term.status === "incoming" ? `Incoming · term begins ${member.term.starts_on.slice(0, 10)}` : "Race not called";
export function StateMemberProfile({ member, otherTerms, stateName }: { member: StateMember; otherTerms: StateMember[]; stateName: string }) {
  return <>
    <section className="hero" aria-labelledby="member-name">
      <Link href={`/state/${member.state.toLowerCase()}`} className="crumb">{stateName}</Link>
      <div className="hero-row"><div className="hero-id">
        <h1 id="member-name" className="hero-title"><span className="ink">{member.name}</span></h1>
        <div className="hero-card"><p className="hero-role">{stateSeatLabel(member)}</p><p className="hero-detail">{status(member)}</p>
          {member.term.contact_url && <a className="hero-action" href={member.term.contact_url} target="_blank" rel="noopener noreferrer">Contact office ↗</a>}
          {member.term.campaign_url && <a className="hero-action" href={member.term.campaign_url} target="_blank" rel="noopener noreferrer">Campaign ↗</a>}
        </div>
      </div>{member.portrait && <figure className="hero-photo"><Image src={member.portrait.url} width={240} height={300} alt={`Portrait of ${member.name}`} unoptimized /><figcaption><Evidence source={member.portrait.source} /> · {member.portrait.credit}</figcaption></figure>}</div>
    </section>
    <section className="section" aria-labelledby="why-title"><h2 id="why-title">Why they&apos;re listed</h2><ul className="list">{member.endorsers.map(({ issuer, source, election }, index) => <li key={`${issuer.id}-${source.id}-${index}`}>{issuer.name}, {election.year} {election.stage} election: <Evidence source={source} /></li>)}</ul></section>
    <section className="section" aria-labelledby="service-title"><h2 id="service-title">Service and election</h2>{member.service && <p>Current service: <Evidence source={member.service} /></p>}<p>{member.election.year} {member.election.stage} election result: <Evidence source={member.result} /></p>{member.contactSource && <p>Office contact: <Evidence source={member.contactSource} /></p>}{member.campaignSource && <p>Campaign: <Evidence source={member.campaignSource} /></p>}</section>
    {otherTerms.length > 0 && <section className="section" aria-labelledby="other-terms"><h2 id="other-terms">Other office or race</h2>{otherTerms.map((other) => <div key={other.term.id}><h3>{stateSeatLabel(other)}</h3><p>{status(other)}</p><p>Election result: <Evidence source={other.result} /></p><ul className="list">{other.endorsers.map(({ issuer, source, election }) => <li key={`${issuer.id}-${source.id}`}>{issuer.name}, {election.year} {election.stage} election: <Evidence source={source} /></li>)}</ul></div>)}</section>}
    <section className="section" aria-labelledby="news-title"><h2 id="news-title">In the news</h2><Suspense fallback={<p className="note">Loading headlines…</p>}><StateNews member={member} stateName={stateName} /></Suspense></section>
  </>;
}
