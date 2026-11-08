import Link from "next/link";
import { MemberList } from "@/components/ui";
import { allMembers, lastChecked, membersIn, newClass } from "@/lib/data";
import { SITE_NAME } from "@/lib/site";
import { STATES } from "@/lib/states";

export default function Home() {
  const fresh = newClass();
  const senate = fresh.filter((m) => m.office === "senate");
  const house = fresh.filter((m) => m.office === "house");
  const total = allMembers().length;

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-id">
          <h1 id="hero-title" className="hero-title hero-title--display">{SITE_NAME}</h1>
          <div className="hero-card">
            <p className="hero-role">The progressives in Congress</p>
            <p className="hero-detail">{total} listed · checked {lastChecked}</p>
            <a className="hero-action" href="#states">Find your state</a>
          </div>
        </div>
        <ul className="hero-links" aria-label="Sections">
          <li><Link href="#new-class">The new class</Link></li>
          <li><Link href="/watch">Races to watch</Link></li>
          <li><Link href="/method">How we pick</Link></li>
        </ul>
      </section>

      <section className="section" id="new-class" aria-labelledby="new-class-title">
        <h2 id="new-class-title" className="section-title">The new class</h2>
        <p className="section-intro">Won or leading on November 3, 2026. Sworn in January 3, 2027.</p>
        <h3 className="subhead">Senate</h3>
        <MemberList members={senate} />
        <h3 className="subhead">House</h3>
        <MemberList members={house} />
        <Link href="/watch" className="more-link">Races still too early to call</Link>
      </section>

      <section className="section" id="states" aria-labelledby="states-title">
        <h2 id="states-title" className="section-title">Browse by state</h2>
        <ul className="state-grid">
          {STATES.filter((s) => membersIn(s.code).length > 0).map((s) => (
            <li key={s.code}>
              <Link href={`/state/${s.code.toLowerCase()}`}>{s.name}</Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
