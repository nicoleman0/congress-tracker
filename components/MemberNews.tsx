import { cacheLife } from "next/cache";
import { NewsPager } from "@/components/NewsPager";
import { getState, type Member } from "@/lib/data";
import { aboutMember, newsUrl, parseRss, type Headline } from "@/lib/news";
import { USER_AGENT } from "@/lib/site";

type News = { headlines: Headline[] } | { error: string };

async function getNews(m: Member): Promise<News> {
  "use cache";
  try {
    const res = await fetch(newsUrl(m, getState(m.state)!.name), { headers: { "user-agent": USER_AGENT } });
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

export async function MemberNews({ m }: { m: Member }) {
  const news = await getNews(m);
  if ("error" in news) return <p className="empty">Couldn&apos;t load headlines right now.</p>;
  if (news.headlines.length === 0) return <p className="empty">No headlines in the last 90 days.</p>;
  const outlets = new Set(news.headlines.map((h) => h.source)).size;
  return (
    <>
      <NewsPager headlines={news.headlines} />
      <p className="jd-note">
        {news.headlines.length} headlines from {outlets} {outlets === 1 ? "outlet" : "outlets"} in the last 90 days, via Google News.
      </p>
    </>
  );
}
