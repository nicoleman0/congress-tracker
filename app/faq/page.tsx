import Link from "next/link";
import { STALE_AFTER_DAYS } from "@/lib/data";
import { REPO_URL, SITE_NAME } from "@/lib/site";

export const metadata = { title: "FAQ" };

const QUESTIONS: { q: string; a: React.ReactNode }[] = [
  {
    q: `What is ${SITE_NAME}?`,
    a: "A list of the progressive members of Congress: why each is listed, how their race went, recent headlines, and how to back them.",
  },
  {
    q: "Who gets listed?",
    a: (
      <>
        Anyone endorsed in 2026 by one of four progressive groups, and current members of the Congressional
        Progressive Caucus. <Link href="/method">How we pick</Link> names the groups.
      </>
    ),
  },
  {
    q: "Is Gracchi affiliated with these groups?",
    a: "No. Gracchi has no affiliation with any of the endorsing groups.",
  },
  {
    q: "My representative isn't listed. Why?",
    a: "They don't meet the rule above. We don't add anyone by judgment.",
  },
  {
    q: "How do I help a member?",
    a: "Their page links to their campaign site to donate or volunteer. The link comes from their FEC filing; where the FEC has none, it links to a search.",
  },
  {
    q: "What's under \"Get involved\"?",
    a: "Links to contact your own representative and senators, and to find local groups, events and call campaigns.",
  },
  {
    q: "Where do race results come from?",
    a: `News outlets' projections. Uncalled races are rechecked daily against NBC News, and the site won't publish if one goes ${STALE_AFTER_DAYS} days without a check.`,
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
        <h1><span className="ink">FAQ</span></h1>
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
