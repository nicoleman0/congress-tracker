import { MemberCard } from "@/components/ui";
import { toWatch } from "@/lib/data";

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
        <h2 className="text-xl font-semibold">Too early to call</h2>
        <p className="text-sm text-muted">Includes safe seats where we haven&apos;t found a race call yet.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{pending.map((m) => <MemberCard key={m.id} m={m} />)}</div>
      </section>
    </div>
  );
}
