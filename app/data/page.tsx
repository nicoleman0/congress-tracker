import type { CSSProperties } from "react";
import Link from "next/link";
import { getGroup, listedMembers, seatLabel, type Member } from "@/lib/data";
import { formatChecked } from "@/lib/freshness";
import { blocSize, chamber, issueCoverage, SEATS } from "@/lib/metrics";
import { committeeName, dollars, fecSpenderUrl, moneyFile, mostOpposed, sum, topSpenders, type Spender } from "@/lib/money";

export const metadata = { title: "By the numbers" };

const TOP = 10;
const CAUCUS_URL = getGroup("CAUCUS").url;

function Meter({ value, total, mark, under, label }: { value: number; total: number; mark?: number; under?: number; label: string }) {
  return (
    <div className="jd-bar" role="img" aria-label={label}>
      {under !== undefined && <span className="jd-bar__fill jd-bar__fill--under" style={{ "--v": `${(under / total) * 100}%` } as CSSProperties} />}
      <span className="jd-bar__fill" style={{ "--v": `${(value / total) * 100}%` } as CSSProperties} />
      {mark && <span className="jd-bar__mark" style={{ "--v": `${(mark / total) * 100}%` } as CSSProperties} />}
    </div>
  );
}

function MemberLinks({ members }: { members: Member[] }) {
  return (
    <ul className="name-list">
      {members.map((m) => <li key={m.id}><Link href={`/member/${m.id}`}>{m.name}</Link> <span className="meta">{seatLabel(m)}</span></li>)}
    </ul>
  );
}

function SpenderList({ spenders }: { spenders: Spender[] }) {
  if (spenders.length === 0) return <p className="empty">None reported.</p>;
  const max = spenders[0].total;
  return (
    <ol className="bars">
      {spenders.slice(0, TOP).map((s) => (
        <li key={s.committee}>
          <span className="bars-label">
            <a href={fecSpenderUrl(s.committee)} target="_blank" rel="noopener noreferrer">{committeeName(s.name)}</a>
            <span className="bars-detail">
              {s.members.slice(0, 3).map((x, i) => <span key={x.member.id}>{i > 0 && ", "}<Link href={`/member/${x.member.id}`}>{x.member.name}</Link></span>)}
              {s.members.length > 3 && ` and ${s.members.length - 3} more`}
            </span>
          </span>
          <span className="bars-value">{dollars(s.total)}</span>
          <Meter value={s.total} total={max} label={`${committeeName(s.name)}: ${dollars(s.total)}`} />
        </li>
      ))}
    </ol>
  );
}

export default function Data() {
  const members = listedMembers();
  const [house, senate] = blocSize(members);
  const coverage = issueCoverage(members);
  const money = moneyFile();
  const spends = members.flatMap((m) => money.spending[m.id] ?? []);
  const targeted = mostOpposed(members);
  const targetMax = targeted[0]?.against ?? 0;

  return (
    <>
      <header className="page-header">
        <h1><span className="ink">By the numbers</span></h1>
        <p className="lede">How many progressives will sit in Congress, where they stand, and who spent money to beat them.</p>
        <p className="meta">Counts cover the {members.length} members we list. <Link href="/method">How we pick</Link>.</p>
      </header>

      <section className="section" aria-labelledby="bloc-title">
        <h2 id="bloc-title">How big is the bloc</h2>
        <div className="stat-grid">
          {[house, senate].map((b) => {
            const seats = SEATS[b.office];
            const dems = chamber(b.office);
            return (
              <div key={b.office} className="stat">
                <p className="stat-number">{b.seated} <span className="stat-of">of {dems.democrats} Democrats</span></p>
                <p className="stat-label">{b.office === "house" ? "House" : "Senate"} seats from January 3, 2027</p>
                <Meter value={b.seated} under={dems.democrats} total={seats.total} mark={seats.majority}
                  label={`${b.seated} progressives among ${dems.democrats} Democrats, of ${seats.total} seats; ${seats.majority} is a majority`} />
                <ul className="jd-legend">
                  <li><span className="jd-swatch" /> Progressives listed here</li>
                  <li><span className="jd-swatch jd-swatch--under" /> All Democrats</li>
                  <li><span className="jd-swatch jd-swatch--mark" /> Majority, {seats.majority}</li>
                </ul>
                <p className="meta">
                  {b.returning} returning · {b.new} new{b.unresolved > 0 && ` · ${b.unresolved} undecided`} · Democrats per{" "}
                  <a href={dems.source.url} target="_blank" rel="noopener noreferrer">{dems.source.label}</a>, {dems.checkedAt.slice(0, 10)}, {dems.uncalled} uncalled
                </p>
              </div>
            );
          })}
        </div>
        <p className="note">Only one senator, Bernie Sanders, is in the <a href={CAUCUS_URL} target="_blank" rel="noopener noreferrer">Progressive Caucus</a>. The other three were endorsed in 2026.</p>
      </section>

      <section className="section" aria-labelledby="issues-title">
        <h2 id="issues-title">Who is on record, by issue</h2>
        <p>Members with a sourced position on each issue, from their own sites or their votes and bills. Open an issue to see who.</p>
        <ul className="issue-bars">
          {coverage.map((c) => (
            <li key={c.issue}>
              <details>
                <summary>
                  <span className="bars-label">{c.name}</span>
                  <span className="bars-value">{c.members.length} of {members.length}</span>
                  <Meter value={c.members.length} total={members.length} label={`${c.name}: ${c.members.length} of ${members.length}`} />
                  {c.onRecord.length > 0 && <span className="bars-detail">{c.onRecord.length} back it with a sponsored or cosponsored bill</span>}
                </summary>
                <MemberLinks members={c.members} />
              </details>
            </li>
          ))}
        </ul>
        <p className="note">A missing position means we found nothing, not that the member opposes it.</p>
      </section>

      <section className="section" aria-labelledby="money-title">
        <h2 id="money-title">Outside money</h2>
        <p>
          Super PACs and other groups can spend without limit for or against a candidate, as long as they don&apos;t coordinate with the campaign.
          In {money.cycle}, they reported spending {dollars(sum(spends, "oppose"))} against the members we list and {dollars(sum(spends, "support"))} for them.
        </p>
        <div className="stat-grid">
          <div className="stat">
            <p className="stat-number">{dollars(sum(spends, "oppose", "primary"))}</p>
            <p className="stat-label">against them in primaries</p>
          </div>
          <div className="stat">
            <p className="stat-number">{dollars(sum(spends, "oppose", "general"))}</p>
            <p className="stat-label">against them in the general election</p>
          </div>
        </div>

        <h3 className="subhead">Biggest spenders against them in primaries</h3>
        <p className="note">Spending to beat them before the general election, in party primaries and in top-two primaries like California&apos;s.</p>
        <SpenderList spenders={topSpenders(members, "oppose", "primary")} />

        <h3 className="subhead">Biggest spenders against them in the general election</h3>
        <SpenderList spenders={topSpenders(members, "oppose", "general")} />

        <h3 className="subhead">Members most targeted</h3>
        <ol className="bars">
          {targeted.slice(0, TOP).map((t) => (
            <li key={t.member.id}>
              <span className="bars-label"><Link href={`/member/${t.member.id}`}>{t.member.name}</Link> <span className="meta">{seatLabel(t.member)}</span></span>
              <span className="bars-value">{dollars(t.against)}</span>
              <Meter value={t.against} total={targetMax} label={`${t.member.name}: ${dollars(t.against)} against`} />
            </li>
          ))}
        </ol>

        <h3 className="subhead">Biggest spenders for them</h3>
        <SpenderList spenders={topSpenders(members, "support")} />

        <p className="note">
          Source: FEC, {formatChecked(money.checkedAt)}. Excludes late-October spending until December 3 filings, and candidates who lost primaries. <Link href="/method">Method</Link>.
        </p>
      </section>
    </>
  );
}
