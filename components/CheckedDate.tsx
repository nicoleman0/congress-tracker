"use client";

import { useSyncExternalStore } from "react";
import { isStale } from "@/lib/freshness";

const noSubscribe = () => () => {};

// Prerenders as checked, then re-judges against the reader's clock, so the label stays right between deploys.
export function CheckedDate({ date }: { date: string }) {
  const stale = useSyncExternalStore(noSubscribe, () => isStale(date, new Date()), () => false);
  return stale ? (
    <span className="platform-stale">Not reconfirmed since {date}</span>
  ) : (
    <span className="platform-checked">Checked {date}</span>
  );
}
