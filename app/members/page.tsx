import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { listedMembers, seatLabel, type Member } from "@/lib/data";
import { STATES } from "@/lib/states";

export const metadata = { title: "All members" };

const stateOrder = new Map(STATES.map((s, i) => [s.code, i]));
// By state name, senators first, then district number.
const rank = (m: Member) => [stateOrder.get(m.state)!, m.office === "senate" ? -1 : Number(m.district) || 0];

export default function Members() {
  const members = listedMembers().sort((a, b) => {
    const [sa, da] = rank(a);
    const [sb, db] = rank(b);
    return sa - sb || da - db;
  });
  return (
    <>
      <header className="page-header">
        <h1><span className="ink">All members</span></h1>
        <p className="meta">{members.length} listed.</p>
      </header>
      <ul className="roster">
        {members.map((m) => (
          <li key={m.id}>
            <Link href={`/member/${m.id}`}>{m.name}</Link>
            <span className="roster-seat">
              {seatLabel(m)}
              {m.status !== "won" && <> <StatusBadge status={m.status} /></>}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
