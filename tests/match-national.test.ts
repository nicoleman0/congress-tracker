import { test } from "node:test";
import assert from "node:assert/strict";
import { districtKey } from "../scripts/match-national";

test("county-style districts match across spellings", () => {
  const roster = (s: string) => districtKey(s);
  const office = (s: string, name: string, code: string) => districtKey(s, name, code);
  assert.equal(office("New Hampshire House, Hillsborough District 18, NH", "New Hampshire", "NH"), roster("Hillsborough 18"));
  assert.equal(office("Massachusetts House, Suffolk 15, MA", "Massachusetts", "MA"), roster("15th Suffolk"));
  assert.equal(office("Massachusetts State Senate, 1st Suffolk District", "Massachusetts", "MA"), roster("First Suffolk"));
  assert.equal(office("Massachusetts State House, Worcester &#038; Hampshire District", "Massachusetts", "MA"), roster("Worcester and Hampshire"));
  assert.notEqual(office("New Hampshire House, District 14, NH", "New Hampshire", "NH"), roster("Hillsborough 14"));
});
