// Kept free of data imports so the browser can judge staleness at read time without a rebuild.
export const STANCE_STALE_AFTER_DAYS = 60;

export const isStale = (checkedAt: string, now: Date) =>
  now.getTime() - Date.parse(checkedAt) > STANCE_STALE_AFTER_DAYS * 86_400_000;

// UTC to the minute. Entries checked before times were recorded hold a bare date; there is no time to recover.
export const CHECKED_AT = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}Z)?$/;

export const checkedNow = (now = new Date()) => now.toISOString().slice(0, 16) + "Z";

export const formatChecked = (checkedAt: string) =>
  checkedAt.length > 10 ? `${checkedAt.slice(0, 10)} ${checkedAt.slice(11, 16)} UTC` : checkedAt;
