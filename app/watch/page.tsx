import { MemberList } from "@/components/ui";
import { lostRaces, toWatch } from "@/lib/data";

export const metadata = { title: "Races to watch · Progressive Bloc" };

export default function Watch() {
  const races = toWatch();
  const leading = races.filter((m) => m.status === "leading");
  const pending = races.filter((m) => m.status === "pending");
  const lost = lostRaces();
  return (
    <>
      <header className="page-header">
        <h1>Races to watch</h1>
        <p className="lede">Progressive candidates whose races aren&apos;t confirmed yet.</p>
      </header>
      <section className="section" aria-labelledby="leading-title">
        <h2 id="leading-title">Leading, not yet called</h2>
        {leading.length ? <MemberList members={leading} /> : <p className="empty">None right now.</p>}
      </section>
      <section className="section" aria-labelledby="pending-title">
        <h2 id="pending-title">Not called, trailing or unknown</h2>
        <p className="section-intro">Behind in the count, or no result found yet.</p>
        {pending.length ? <MemberList members={pending} /> : <p className="empty">None right now.</p>}
      </section>
      {lost.length > 0 && (
        <section className="section" aria-labelledby="lost-title">
          <h2 id="lost-title">Lost</h2>
          <p className="section-intro">Kept here for the record. They don&apos;t appear on state pages.</p>
          <MemberList members={lost} />
        </section>
      )}
    </>
  );
}
