import { groupList } from "@/lib/data";

export const metadata = { title: "How we pick · Progressive Bloc" };

export default function Method() {
  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-3xl font-bold">How we pick</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Who counts as progressive</h2>
        <p>A member is listed if at least one of these applies. Each profile shows which.</p>
        <ul className="list-disc pl-5">
          {groupList().map((g) => (
            <li key={g.code}>
              <a href={g.url} target="_blank" rel="noopener noreferrer" className="underline">{g.name}</a>
              {g.code === "CAUCUS" ? ": current member" : ": endorsed in 2026"}
            </li>
          ))}
        </ul>
        <p className="text-muted">
          We don&apos;t add anyone by judgment. Senators who aren&apos;t caucus members and weren&apos;t endorsed by
          these groups are not listed. Governors and state legislators are not covered yet.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Race status</h2>
        <ul className="list-disc pl-5">
          <li><b>Won</b>: a news outlet projected them the winner.</li>
          <li><b>Leading</b>: ahead in reported counts, with no call found yet.</li>
          <li><b>Not called</b>: behind in the count, or no result found yet.</li>
          <li><b>Incumbent</b>: a current caucus member. Their 2026 results are not yet verified.</li>
          <li><b>Lost</b>: another candidate was projected the winner.</li>
        </ul>
        <p className="text-muted">
          Each profile shows when its status was last checked. Unresolved races are rechecked daily against
          NBC News race pages, and every change is reviewed before it goes live.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What&apos;s coming</h2>
        <ul className="list-disc pl-5">
          <li>Address lookup, once the 2026 district maps are in public data.</li>
          <li>The full House roster from official data after January 3, 2027.</li>
          <li>Votes compared with campaign platforms.</li>
          <li>Governors and state legislators.</li>
        </ul>
      </section>
    </div>
  );
}
