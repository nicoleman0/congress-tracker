import Link from "next/link";
import { MemberList } from "@/components/ui";
import { listedMembers, membersIn, newClass } from "@/lib/data";
import { STATES } from "@/lib/states";

export default function Home() {
  const fresh = newClass();
  const senate = fresh.filter((m) => m.office === "senate");
  const house = fresh.filter((m) => m.office === "house");
  const total = listedMembers().length;

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-id hero-id--home">
          <div className="hero-card">
            <h1 id="hero-title" className="hero-role">The progressives in Congress</h1>
            <p className="hero-detail">{total} listed</p>
            <a className="hero-action" href="#states">Find your state</a>
          </div>
        </div>
        <ul className="hero-links" aria-label="Sections">
          <li><Link href="#new-class">The new class</Link></li>
          <li><Link href="/members">All members</Link></li>
          <li><Link href="/method">How we pick</Link></li>
        </ul>
      </section>

      <section className="section" id="new-class" aria-labelledby="new-class-title">
        <h2 id="new-class-title" className="section-title"><span className="ink">The new class</span></h2>
        <p className="section-intro">Won or leading on November 3, 2026. Sworn in January 3, 2027.</p>
        <h3 className="subhead">Senate</h3>
        <MemberList members={senate} />
        <h3 className="subhead">House</h3>
        <MemberList members={house} />
      </section>

      <section className="section" id="states" aria-labelledby="states-title">
        <h2 id="states-title" className="section-title"><span className="ink">Browse by state</span></h2>
        <ul className="state-grid">
          {STATES.map((s) => {
            const n = membersIn(s.code).length;
            return (
              <li key={s.code}>
                <Link href={`/state/${s.code.toLowerCase()}`} className={n ? undefined : "state-none"}>{s.name}</Link>
                {n > 0 && <span className="state-count">{n}</span>}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
