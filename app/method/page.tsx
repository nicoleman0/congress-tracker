import { groupList } from "@/lib/data";
import { statePublicationVersion, statePublicationReviewedAt } from "@/lib/state-offices";

export const metadata = { title: "How we pick" };

export default function Method() {
  return (
    <>
      <header className="page-header">
        <h1><span className="ink">How we pick</span></h1>
      </header>

      <section className="section" aria-labelledby="who-title">
        <h2 id="who-title">Who counts as progressive</h2>
        <p>A member is listed if at least one of these applies.</p>
        <ul className="list">
          {groupList().map((g) => (
            <li key={g.code}>
              <a href={g.url} target="_blank" rel="noopener noreferrer">{g.name}</a>
              {g.code === "CAUCUS" ? ": current member" : ": endorsed in 2026"}
            </li>
          ))}
        </ul>
        <p className="jd-note">We don&apos;t add anyone by judgment.</p>
      </section>

      {statePublicationVersion && <section className="section" aria-labelledby="state-title">
        <h2 id="state-title">Governors and state legislators</h2>
        <p>We list serving officials and confirmed incoming winners endorsed by Working Families Party, Our Revolution, Democratic Socialists of America, Run for Something, Progressive Change Campaign Committee or Sunrise Movement, including their verified official chapters. An endorsement must be from the election that won the term, including its primary. Withdrawn endorsements do not qualify. Appointments without a qualifying endorsement for the current term are excluded.</p>
        <p>We show unresolved state races separately and recheck their result sources within three days. Each profile names the issuer and links to its endorsement, service and election sources.</p>
        <p>Coverage was reviewed against the listed sources on {statePublicationReviewedAt?.slice(0, 10)}. This is not a list of every progressive officeholder.</p>
      </section>}

      <section className="section" aria-labelledby="status-title">
        <h2 id="status-title">Race status</h2>
        <ul className="list">
          <li><b>Won</b>: a news outlet projected them the winner.</li>
          <li><b>Leading</b>: ahead in reported counts, with no call found yet.</li>
          <li><b>Not called</b>: behind in the count, or no result found yet.</li>
          <li><b>Incumbent</b>: a current caucus member whose seat was not on the 2026 ballot.</li>
          <li><b>Lost</b>: another candidate was projected the winner.</li>
        </ul>
        <p className="jd-note">Unresolved races are rechecked daily against NBC News.</p>
      </section>

      <section className="section" aria-labelledby="links-title">
        <h2 id="links-title">Campaign links and news</h2>
        <p>Campaign links come from FEC filings. When a filing lists no site, or a dead one, we use the campaign&apos;s own site as cited by news coverage or the member&apos;s Wikipedia page. Headlines come from Google News.</p>
      </section>

      <section className="section" aria-labelledby="platform-title">
        <h2 id="platform-title">Platform and record</h2>
        <p>
          Positions are summarized in our words from each member&apos;s campaign site, or from their official House site
          when the campaign site says nothing on the issue. Each links to the page it came from, and we keep the passage
          it summarizes. Every week we check that the passage is still on that page. A position shows the date it was
          last confirmed, and one we haven&apos;t confirmed in 60 days is marked as possibly out of date.
        </p>
        <p>
          Entries marked Record are sponsorships or cosponsorships of a few benchmark bills, taken from Congress.gov
          and rebuilt weekly. A missing issue means we found nothing on it, not that the member opposes it.
        </p>
      </section>

      <section className="section" aria-labelledby="money-method-title">
        <h2 id="money-method-title">Outside money</h2>
        <p>
          Outside money is independent expenditures: spending for or against a candidate by a group that doesn&apos;t
          coordinate with the campaign. We take it from FEC filings for each member&apos;s candidate id, and rebuild it weekly.
          We count regular reports only, leave out memo lines, and check our sums against the FEC&apos;s own totals.
          The 24- and 48-hour notices filed before an election repeat what later reports contain, so we skip them.
          That means the newest spending appears a few weeks late.
        </p>
      </section>

      <section className="section" aria-labelledby="coming-title">
        <h2 id="coming-title">What&apos;s coming</h2>
        <ul className="list">
          <li>Address lookup, once the 2026 district maps are in public data.</li>
          <li>The full House roster from official data after January 3, 2027.</li>
          <li>Votes compared with campaign platforms.</li>
          {!statePublicationVersion && <li>Governors and state legislators.</li>}
        </ul>
      </section>
    </>
  );
}
