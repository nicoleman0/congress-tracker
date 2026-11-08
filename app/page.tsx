import Link from "next/link";
import { MemberCard } from "@/components/ui";
import { allMembers, newClass } from "@/lib/data";
import { STATES } from "@/lib/states";

export default function Home() {
  const fresh = newClass();
  const senate = fresh.filter((m) => m.office === "senate");
  const house = fresh.filter((m) => m.office === "house");
  const total = allMembers().length;

  return (
    <div className="space-y-12">
      <section className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">The progressive bloc in Congress</h1>
        <p className="text-lg text-muted max-w-2xl">
          Who they are, how to back them, and where to plug in locally. Pick your state to see your
          district. If your member isn&apos;t a progressive, we point you to the groups organizing there.
        </p>
        <p className="text-sm text-muted">
          {total} listed. Every listing cites why it&apos;s here. <Link href="/method" className="underline">How we pick</Link>.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">The new class</h2>
          <p className="text-sm text-muted">Won or leading on November 3, 2026. Sworn in January 3, 2027.</p>
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Senate</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {senate.map((m) => <MemberCard key={m.id} m={m} />)}
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted pt-2">House</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {house.map((m) => <MemberCard key={m.id} m={m} />)}
        </div>
        <Link href="/watch" className="inline-block text-sm text-accent underline">Races still too early to call →</Link>
      </section>

      <section id="states" className="space-y-4 scroll-mt-4">
        <h2 className="text-xl font-semibold">Browse by state</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {STATES.map((s) => (
            <Link
              key={s.code}
              href={`/state/${s.code.toLowerCase()}`}
              className="rounded-md border border-line bg-surface px-3 py-2 text-sm hover:border-accent"
            >
              {s.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
