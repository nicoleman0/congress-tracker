import Link from "next/link";
import { getGroup, listedMembers, seatLabel, type Member } from "@/lib/data";
import { formatChecked } from "@/lib/freshness";
import { blocSize, issueCoverage, SEATS } from "@/lib/metrics";
import { dollars, fecSpenderUrl, moneyFile, mostOpposed, sum, topSpenders, type Spender } from "@/lib/money";

export const metadata = { title: "By the numbers" };

const TOP = 10;
const CAUCUS_URL = getGroup("CAUCUS").url;

function Meter({ value, total, mark, label }: { value: number; total: number; mark?: number; label: string }) {
  return (
    <div className="meter" role="img" aria-label={label}>
      <span className="meter-fill" style={{ width: `${(value / total) * 100}%` }} />
      {mark && <span className="meter-mark" style={{ left: `${(mark / total) * 100}%` }} />}
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
            <a href={fecSpenderUrl(s.committee)} target="_blank" rel="noopener noreferrer">{s.name}</a>
            <span className="bars-detail">
              {s.members.slice(0, 3).map((x, i) => <span key={x.member.id}>{i > 0 && ", "}<Link href={`/member/${x.member.id}`}>{x.member.name}</Link></span>)}
              {s.members.length > 3 && ` and ${s.members.length - 3} more`}
            </span>
          </span>
          <span className="bars-value">{dollars(s.total)}</span>
          <Meter value={s.total} total={max} label={`${s.name}: ${dollars(s.total)}`} />
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
          {[house, senate].map((b) => (
            <div key={b.office} className="stat">
              <p className="stat-number">{b.seated} <span className="stat-of">of {SEATS[b.office].total}</span></p>
              <p className="stat-label">{b.office === "house" ? "House" : "Senate"} seats from January 3, 2027</p>
              <Meter value={b.seated} total={SEATS[b.office].total} mark={SEATS[b.office].majority}
                label={`${b.seated} of ${SEATS[b.office].total} seats; ${SEATS[b.office].majority} is a majority`} />
              <p className="meta">{b.returning} returning · {b.new} new · {SEATS[b.office].majority} is a majority{b.unresolved > 0 && ` · ${b.unresolved} more race${b.unresolved > 1 ? "s" : ""} not decided`}</p>
            </div>
          ))}
        </div>
        <p className="note">
          The Senate count is low by design. Only one senator, Bernie Sanders, belongs to the{" "}
          <a href={CAUCUS_URL} target="_blank" rel="noopener noreferrer">Progressive Caucus</a>, so the rest are senators endorsed by our groups in 2026.
        </p>
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
          From independent expenditures filed with the FEC, checked {formatChecked(money.checkedAt)}. We count regular reports only.
          Spending in the last weeks before November 3 shows up once post-election reports are filed, due December 3, 2026.
          Candidates who lost their primary aren&apos;t listed here, so primary spending against progressives is higher than shown.
          {money.missing.length > 0 && ` ${money.missing.length} members have no FEC committee on file with us and are left out.`}
        </p>
      </section>
    </>
  );
}
