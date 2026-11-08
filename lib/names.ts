// Name matching shared by the race refresh, campaign links and news filtering.
export const SUFFIX = /\b(jr|sr|ii|iii|iv)\.?$/i;

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Lowercase, no accents, suffix or punctuation: "André Carson Jr." -> "andre carson".
export const bare = (name: string) => norm(name.replace(SUFFIX, "")).replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
