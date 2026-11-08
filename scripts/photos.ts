// Downloads official portraits from Congress.gov for listed members who are in the current Congress.
// Members not yet sworn in have none and are reported. Writes public/photos/<id>.jpg and data/photos.json.
// Usage: DATA_GOV_API_KEY=... tsx scripts/photos.ts
import fs from "node:fs";
import sharp from "sharp";
import type { Member, Photo } from "@/lib/data";
import { STATES } from "@/lib/states";
import { matches } from "./record";

const MEMBERS = "data/members.json";
const PHOTOS = "data/photos.json";
const DIR = "public/photos";
const API = "https://api.congress.gov/v3";
const CONGRESS = 119;
const WIDTH = 480;

export type ApiMember = {
  bioguideId: string;
  name: string; // "Last, First M."
  state: string; // full name
  district?: number | null;
  depiction?: { imageUrl: string; attribution?: string };
  terms: { item: { chamber: string }[] };
};

export function findMember(m: Member, list: ApiMember[]): ApiMember | string {
  const hits = list.filter((a) => {
    const [lastName, firstName = ""] = a.name.split(",").map((s) => s.trim());
    const senate = a.terms.item.at(-1)?.chamber === "Senate";
    const state = STATES.find((s) => s.name === a.state)?.code ?? "";
    return matches(m, { lastName, firstName, state, district: senate ? null : (a.district ?? 0) });
  });
  return hits.length === 1 ? hits[0] : `${hits.length} current members match`;
}

// The list API serves 200px thumbnails; the same name without "_200" is the full portrait when one exists.
export const fullSize = (url: string) => url.replace(/_200(\.\w+)$/, "$1");

async function api(path: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ ...params, format: "json", api_key: process.env.DATA_GOV_API_KEY! });
  const res = await fetch(`${API}${path}?${qs}`);
  if (!res.ok) throw new Error(`congress.gov ${path}: HTTP ${res.status}`);
  return res.json();
}

async function image(url: string) {
  for (const u of [fullSize(url), url]) {
    const res = await fetch(u);
    if (res.ok && res.headers.get("content-type")?.startsWith("image/")) return Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`no image at ${url}`);
}

async function main() {
  if (!process.env.DATA_GOV_API_KEY) throw new Error("set DATA_GOV_API_KEY (free at https://api.data.gov/signup/)");
  const members = (JSON.parse(fs.readFileSync(MEMBERS, "utf8")) as { members: Member[] }).members;
  const list: ApiMember[] = [];
  for (let offset = 0; ; offset += 250) {
    const page = await api(`/member/congress/${CONGRESS}`, { currentMember: "true", limit: "250", offset: String(offset) });
    list.push(...page.members);
    if (!page.pagination?.next) break;
  }

  fs.mkdirSync(DIR, { recursive: true });
  const photos: Record<string, Photo> = {};
  const problems: string[] = [];
  for (const m of members) {
    const a = findMember(m, list);
    if (typeof a === "string") { problems.push(`${m.id}: ${a}`); continue; }
    if (!a.depiction?.imageUrl) { problems.push(`${m.id}: ${a.bioguideId} has no portrait`); continue; }
    try {
      const { data, info } = await sharp(await image(a.depiction.imageUrl))
        .resize({ width: WIDTH, withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });
      fs.writeFileSync(`${DIR}/${m.id}.jpg`, data);
      photos[m.id] = {
        src: `/photos/${m.id}.jpg`, width: info.width, height: info.height,
        // Some attributions arrive as HTML links.
        bioguide: a.bioguideId, credit: a.depiction.attribution?.replace(/<[^>]+>/g, "").trim() || "Congress.gov",
      };
    } catch (e) {
      problems.push(`${m.id}: ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  fs.writeFileSync(PHOTOS, JSON.stringify(photos, null, 2) + "\n");
  console.log([`Saved ${Object.keys(photos).length} portraits.`, "", `### No portrait (${problems.length})`, ...problems.map((p) => `- ${p}`)].join("\n"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
