// Kept free of data imports so the browser can judge staleness at read time without a rebuild.
export const STANCE_STALE_AFTER_DAYS = 60;

export const isStale = (checkedAt: string, now: Date) =>
  now.getTime() - Date.parse(checkedAt) > STANCE_STALE_AFTER_DAYS * 86_400_000;
