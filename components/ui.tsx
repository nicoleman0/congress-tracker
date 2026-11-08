import Link from "next/link";
import type { Action } from "@/lib/actions";
import { getGroup, seatLabel, type Member, type Status } from "@/lib/data";

const STATUS_TEXT: Record<Status, string> = {
  won: "Won",
  leading: "Leading",
  pending: "Too early to call",
  incumbent: "Incumbent",
};
const STATUS_CLASS: Record<Status, string> = {
  won: "text-won border-won",
  leading: "text-leading border-leading",
  pending: "text-pending border-pending",
  incumbent: "text-muted border-line",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}>
      {STATUS_TEXT[status]}
    </span>
  );
}

export function MemberCard({ m }: { m: Member }) {
  return (
    <Link
      href={`/member/${m.id}`}
      className="block rounded-lg border border-line bg-surface p-4 hover:border-accent transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{m.name}</div>
          <div className="text-sm text-muted">{seatLabel(m)}</div>
        </div>
        <StatusBadge status={m.status} />
      </div>
      <div className="mt-3 text-xs text-muted">{m.endorsedBy.map((c) => getGroup(c).name).join(" · ")}</div>
    </Link>
  );
}

export function ActionList({ actions }: { actions: Action[] }) {
  return (
    <ul className="space-y-2">
      {actions.map((a) => (
        <li key={a.href + a.label}>
          <a
            href={a.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md border border-line bg-surface px-4 py-3 hover:border-accent"
          >
            <span className="font-medium text-accent">{a.label} ↗</span>
            {a.detail && <span className="block text-sm text-muted">{a.detail}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}
