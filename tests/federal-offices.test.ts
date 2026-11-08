import { test } from "node:test";
import assert from "node:assert/strict";
import type { Member } from "../lib/data";
import { assertFederalOffices } from "../scripts/federal-offices";

test("federal jobs reject state offices before processing", () => {
  const member = { id: "example", office: "governor" } as unknown as Member;
  assert.throws(() => assertFederalOffices([member]), /example: unsupported federal office governor/);
  assert.doesNotThrow(() => assertFederalOffices([{ ...member, office: "house" }, { ...member, office: "senate" }]));
});
