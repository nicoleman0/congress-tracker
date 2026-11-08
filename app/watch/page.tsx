import { MemberList } from "@/components/ui";
import { toWatch } from "@/lib/data";

export const metadata = { title: "Races to watch" };

export default function Watch() {
  const races = toWatch();
  const leading = races.filter((m) => m.status === "leading");
  const pending = races.filter((m) => m.status === "pending");
  return (
    <>
      <header className="page-header">
        <h1><span className="ink">Races to watch</span></h1>
      </header>
      <section className="section" aria-labelledby="leading-title">
        <h2 id="leading-title">Leading, not yet called</h2>
        {leading.length ? <MemberList members={leading} /> : <p className="empty">None right now.</p>}
      </section>
      <section className="section" aria-labelledby="pending-title">
        <h2 id="pending-title">Not called, trailing or unknown</h2>
        {pending.length ? <MemberList members={pending} /> : <p className="empty">None right now.</p>}
      </section>
    </>
  );
}
