import assert from "node:assert/strict";
import { test } from "node:test";
import { plugIn } from "@/lib/actions";
import { STATES } from "@/lib/states";

test("a state page opens Mobilize on that state's events", () => {
  const ny = STATES.find((s) => s.code === "NY")!;
  const mobilize = plugIn(ny).find((a) => a.href.includes("mobilize.us"))!;
  assert.equal(mobilize.href, "https://www.mobilize.us/?state=NY");
  assert.equal(mobilize.label, "Find events in New York on Mobilize");
});

test("without a state the links stay general", () => {
  assert.equal(plugIn().find((a) => a.href.includes("mobilize.us"))!.href, "https://www.mobilize.us/");
});
