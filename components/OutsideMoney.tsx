import type { CSSProperties } from "react";
import Link from "next/link";
import { formatChecked } from "@/lib/freshness";
import { committeeName, dollars, fecSpenderUrl, moneyFile, type Spend, type Stage } from "@/lib/money";

// Committees named in the bar and legend; the rest share one segment.
const TOP = 3;
// A segment this share of the wider bar has room for its name.
const LABEL_SHARE = 0.35;

type Group = { committee: string; name: string; total: number; stages: Stage[] };

function byCommittee(list: Spend[]): Group[] {
  const by = new Map<string, Group>();
  for (const s of list) {
    const g = by.get(s.committee) ?? { committee: s.committee, name: committeeName(s.name), total: 0, stages: [] };
    g.total += s.total;
    if (!g.stages.includes(s.stage)) g.stages.push(s.stage);
    by.set(s.committee, g);
  }
  return [...by.values()].sort((a, b) => b.total - a.total);
}

const Spender = ({ g }: { g: Group }) => (
  <a href={fecSpenderUrl(g.committee)} target="_blank" rel="noopener noreferrer">{g.name}</a>
);

// Both sides share one scale, so bar length compares money against and for.
export function OutsideMoney({ spends }: { spends: Spend[] }) {
  const sides = (["oppose", "support"] as const)
    .map((side) => {
      const groups = byCommittee(spends.filter((s) => s.side === side));
      return { side, groups, total: groups.reduce((n, g) => n + g.total, 0) };
    })
    .filter((s) => s.groups.length > 0);
  const max = Math.max(...sides.map((s) => s.total));

  return (
    <>
      {sides.map(({ side, groups, total }) => {
        const top = groups.slice(0, TOP);
        const rest = groups.slice(TOP);
        const restTotal = rest.reduce((n, g) => n + g.total, 0);
        return (
          <div key={side} className={`money-side jd-tone--${side}`}>
            <h3 className="money-head">
              {side === "oppose" ? "Against" : "For"} <span className="money-total">{dollars(total)}</span>
            </h3>
            <div className="jd-bar jd-bar--segmented" style={{ "--v": `${(total / max) * 100}%` } as CSSProperties} aria-hidden="true">
              {top.map((g, i) => (
                <span key={g.committee} className="jd-bar__segment" data-rank={i} style={{ "--v": g.total } as CSSProperties}>
                  {g.total / max >= LABEL_SHARE && g.name}
                </span>
              ))}
              {rest.length > 0 && <span className="jd-bar__segment" data-rank="rest" style={{ "--v": restTotal } as CSSProperties} />}
            </div>
            <ul className="jd-legend">
              {top.map((g, i) => (
                <li key={g.committee}>
                  <span className="jd-swatch" data-rank={i} /> <Spender g={g} /> <span className="money-amount">{dollars(g.total)}</span>
                </li>
              ))}
              {rest.length > 0 && (
                <li>
                  <span className="jd-swatch" data-rank="rest" /> {rest.length} {rest.length === 1 ? "other" : "others"}{" "}
                  <span className="money-amount">{dollars(restTotal)}</span>
                </li>
              )}
            </ul>
            <details className="money-all jd-disclosure">
              <summary>All {groups.length} {groups.length === 1 ? "group" : "groups"} by election</summary>
              <ol className="jd-ruled">
                {groups.map((g) => (
                  <li key={g.committee}>
                    <span><Spender g={g} /> <span className="jd-small">{g.stages.join(", ")}</span></span>
                    <span className="money-amount">{dollars(g.total)}</span>
                  </li>
                ))}
              </ol>
            </details>
          </div>
        );
      })}
      <p className="jd-note">
        Source: FEC, {formatChecked(moneyFile().checkedAt)}. Late-October spending posts after December 3.{" "}
        <Link href="/data#money-title">How this compares</Link>.
      </p>
    </>
  );
}
