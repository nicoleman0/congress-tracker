import Link from "next/link";
import type { Action } from "@/lib/actions";
import { getGroup, seatLabel, type Member, type Status } from "@/lib/data";

export const STATUS_TEXT: Record<Status, string> = {
  won: "Won",
  leading: "Leading",
  pending: "Not called",
  incumbent: "Incumbent",
  lost: "Lost",
};

export function StatusBadge({ status }: { status: Status }) {
  if (status === "incumbent") return null;
  return <span className={`chip chip--${status}`}>{STATUS_TEXT[status]}</span>;
}

export function MemberList({ members }: { members: Member[] }) {
  return (
    <ul className="member-list">
      {members.map((m) => (
        <li key={m.id}>
          <Link href={`/member/${m.id}`} className="member-row">
            <span className="member-name">{m.name}</span>
            <span className="member-seat">
              {seatLabel(m)} <StatusBadge status={m.status} />
            </span>
            <span className="member-groups">{m.endorsedBy.map((c) => getGroup(c).name).join(" · ")}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ActionList({ actions }: { actions: Action[] }) {
  return (
    <ul className="action-list">
      {actions.map((a) => (
        <li key={a.href + a.label}>
          <a href={a.href} target="_blank" rel="noopener noreferrer" className="action-link">
            {a.label} ↗
          </a>
          {a.detail && <span className="action-detail">{a.detail}</span>}
        </li>
      ))}
    </ul>
  );
}
