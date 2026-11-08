import { groupList } from "@/lib/data";

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
        <p className="note">We don&apos;t add anyone by judgment.</p>
      </section>

      <section className="section" aria-labelledby="status-title">
        <h2 id="status-title">Race status</h2>
        <ul className="list">
          <li><b>Won</b>: a news outlet projected them the winner.</li>
          <li><b>Leading</b>: ahead in reported counts, with no call found yet.</li>
          <li><b>Not called</b>: behind in the count, or no result found yet.</li>
          <li><b>Incumbent</b>: a current caucus member whose seat was not on the 2026 ballot.</li>
          <li><b>Lost</b>: another candidate was projected the winner.</li>
        </ul>
        <p className="note">Unresolved races are rechecked daily against NBC News.</p>
      </section>

      <section className="section" aria-labelledby="links-title">
        <h2 id="links-title">Campaign links and news</h2>
        <p>Campaign links come from FEC filings. When a filing lists no site, or a dead one, we use the campaign&apos;s own site as cited by news coverage or the member&apos;s Wikipedia page. Headlines come from Google News.</p>
      </section>

      <section className="section" aria-labelledby="platform-title">
        <h2 id="platform-title">Platform and record</h2>
        <p>
          Positions are summarized in our words from each member&apos;s campaign site, and every one links to the page
          it came from. Entries marked Record are sponsorships or cosponsorships of a few benchmark bills, taken from
          Congress.gov. A missing issue means we found nothing on it, not that the member opposes it.
        </p>
      </section>

      <section className="section" aria-labelledby="coming-title">
        <h2 id="coming-title">What&apos;s coming</h2>
        <ul className="list">
          <li>Address lookup, once the 2026 district maps are in public data.</li>
          <li>The full House roster from official data after January 3, 2027.</li>
          <li>Votes compared with campaign platforms.</li>
          <li>Governors and state legislators.</li>
        </ul>
      </section>
    </>
  );
}
