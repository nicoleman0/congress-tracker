import Link from "next/link";
import { STALE_AFTER_DAYS } from "@/lib/data";
import { REPO_URL, SITE_NAME } from "@/lib/site";
import { statePublicationVersion } from "@/lib/state-offices";

export const metadata = { title: "FAQ" };

const QUESTIONS: { q: string; a: React.ReactNode }[] = [
  {
    q: `What is ${SITE_NAME}?`,
    a: statePublicationVersion ? "A list of qualifying members of Congress, governors and state legislators: why each is listed, recent headlines, and how to back them." : "A list of the progressive members of Congress: why each is listed, how their race went, recent headlines, and how to back them.",
  },
  {
    q: "Who gets listed?",
    a: (
      <>
        Anyone endorsed in 2026 by one of four progressive groups, and current members of the Congressional
        Progressive Caucus. {statePublicationVersion && "State officials qualify through an endorsement in the election that won their current term."} <Link href="/method">How we pick</Link> names the groups.
      </>
    ),
  },
  {
    q: "Is Gracchi affiliated with these groups?",
    a: "No. Gracchi has no affiliation with any of the endorsing groups.",
  },
  {
    q: "My representative isn't listed. Why?",
    a: "They may not meet the listing rule. We don't add anyone by judgment.",
  },
  {
    q: "How do I help a member?",
    a: statePublicationVersion ? "Their page links to their official office or campaign when available, with a source for the link." : "Their page links to their campaign site to donate or volunteer. The link comes from their FEC filing; where the FEC has none, it links to a search.",
  },
  {
    q: "What's under \"Get involved\"?",
    a: "Links to contact your own representative and senators, and to find local groups, events and call campaigns.",
  },
  {
    q: "Where do race results come from?",
    a: statePublicationVersion ? `Congressional races use news outlets' projections. State profiles cite their election-result sources. Uncalled races must be checked within ${STALE_AFTER_DAYS} days.` : `News outlets' projections. Uncalled races are rechecked daily against NBC News, and the site won't publish if one goes ${STALE_AFTER_DAYS} days without a check.`,
  },
  {
    q: "Where do the headlines come from?",
    a: "Google News, filtered to headlines that name the member.",
  },
  {
    q: "When will voting records appear?",
    a: "After the new Congress is sworn in on January 3, 2027.",
  },
  {
    q: "I found a mistake.",
    a: (
      <>
        Open an issue on <a href={`${REPO_URL}/issues`}>GitHub</a>.
      </>
    ),
  },
];

export default function Faq() {
  return (
    <>
      <header className="page-header">
        <h1><span className="jd-ink">FAQ</span></h1>
      </header>
      <div className="faq">
        {QUESTIONS.map(({ q, a }, i) => (
          <section key={q} aria-labelledby={`faq-${i}`}>
            <h2 id={`faq-${i}`}>{q}</h2>
            <p>{a}</p>
          </section>
        ))}
      </div>
    </>
  );
}
