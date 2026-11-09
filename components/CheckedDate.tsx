"use client";

import { useSyncExternalStore } from "react";
import { formatChecked, isStale } from "@/lib/freshness";

const noSubscribe = () => () => {};

// Prerenders as checked, then re-judges against the reader's clock, so the label stays right between deploys.
export function CheckedDate({ date }: { date: string }) {
  const stale = useSyncExternalStore(noSubscribe, () => isStale(date, new Date()), () => false);
  const shown = formatChecked(date);
  return stale ? (
    <span className="platform-stale">Not reconfirmed since {shown}</span>
  ) : (
    <span className="platform-checked jd-small">Checked {shown}</span>
  );
}
