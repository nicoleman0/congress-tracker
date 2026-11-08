import { cacheLife } from "next/cache";
import type { Member } from "@/lib/data";
import { aboutMember, newsUrl, parseRss, type Headline } from "@/lib/news";

type News = { headlines: Headline[] } | { error: string };

async function getNews(m: Member): Promise<News> {
  "use cache";
  try {
    const res = await fetch(newsUrl(m), { headers: { "user-agent": "Mozilla/5.0 (congress-tracker news)" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const headlines = aboutMember(m, parseRss(await res.text()));
    cacheLife("hours");
    return { headlines };
  } catch (e) {
    // Retry soon instead of showing the failure for an hour.
    console.error(`news for ${m.id}: ${(e as Error).message}`);
    cacheLife("minutes");
    return { error: (e as Error).message };
  }
}

const day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export async function MemberNews({ m }: { m: Member }) {
  const news = await getNews(m);
  if ("error" in news) return <p className="empty">Couldn&apos;t load headlines right now.</p>;
  if (news.headlines.length === 0) return <p className="empty">No headlines naming them in the past 30 days.</p>;
  return (
    <ul className="news-list">
      {news.headlines.map((h) => (
        <li key={h.url}>
          <a href={h.url} target="_blank" rel="noopener noreferrer">{h.title}</a>
          <span className="news-source">{h.source} · {day.format(new Date(h.date))}</span>
        </li>
      ))}
    </ul>
  );
}
