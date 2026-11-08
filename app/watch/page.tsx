import { MemberCard } from "@/components/ui";
import { lostRaces, toWatch } from "@/lib/data";

export const metadata = { title: "Races to watch · Progressive Bloc" };

export default function Watch() {
  const races = toWatch();
  const leading = races.filter((m) => m.status === "leading");
  const pending = races.filter((m) => m.status === "pending");
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Races to watch</h1>
        <p className="text-muted">Progressive candidates whose races aren&apos;t confirmed yet.</p>
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Leading, not yet called</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{leading.map((m) => <MemberCard key={m.id} m={m} />)}</div>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Not called, trailing or unknown</h2>
        <p className="text-sm text-muted">Behind in the count, or no result found yet.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{pending.map((m) => <MemberCard key={m.id} m={m} />)}</div>
      </section>
      {lostRaces().length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Lost</h2>
          <p className="text-sm text-muted">Kept here for the record. They don&apos;t appear on state pages.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{lostRaces().map((m) => <MemberCard key={m.id} m={m} />)}</div>
        </section>
      )}
    </div>
  );
}
