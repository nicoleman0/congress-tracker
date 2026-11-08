// House seats per state from the 2020 apportionment. DC has one non-voting delegate.
export type State = { code: string; name: string; seats: number; senators: boolean };

const rows: [string, string, number][] = [
  ["AL", "Alabama", 7], ["AK", "Alaska", 1], ["AZ", "Arizona", 9], ["AR", "Arkansas", 4],
  ["CA", "California", 52], ["CO", "Colorado", 8], ["CT", "Connecticut", 5], ["DE", "Delaware", 1],
  ["FL", "Florida", 28], ["GA", "Georgia", 14], ["HI", "Hawaii", 2], ["ID", "Idaho", 2],
  ["IL", "Illinois", 17], ["IN", "Indiana", 9], ["IA", "Iowa", 4], ["KS", "Kansas", 4],
  ["KY", "Kentucky", 6], ["LA", "Louisiana", 6], ["ME", "Maine", 2], ["MD", "Maryland", 8],
  ["MA", "Massachusetts", 9], ["MI", "Michigan", 13], ["MN", "Minnesota", 8], ["MS", "Mississippi", 4],
  ["MO", "Missouri", 8], ["MT", "Montana", 2], ["NE", "Nebraska", 3], ["NV", "Nevada", 4],
  ["NH", "New Hampshire", 2], ["NJ", "New Jersey", 12], ["NM", "New Mexico", 3], ["NY", "New York", 26],
  ["NC", "North Carolina", 14], ["ND", "North Dakota", 1], ["OH", "Ohio", 15], ["OK", "Oklahoma", 5],
  ["OR", "Oregon", 6], ["PA", "Pennsylvania", 17], ["RI", "Rhode Island", 2], ["SC", "South Carolina", 7],
  ["SD", "South Dakota", 1], ["TN", "Tennessee", 9], ["TX", "Texas", 38], ["UT", "Utah", 4],
  ["VT", "Vermont", 1], ["VA", "Virginia", 11], ["WA", "Washington", 10], ["WV", "West Virginia", 2],
  ["WI", "Wisconsin", 8], ["WY", "Wyoming", 1],
];

export const STATES: State[] = [
  ...rows.map(([code, name, seats]) => ({ code, name, seats, senators: true })),
  { code: "DC", name: "District of Columbia", seats: 1, senators: false },
].sort((a, b) => a.name.localeCompare(b.name));

const voting = rows.reduce((n, [, , s]) => n + s, 0);
if (voting !== 435) throw new Error(`states.ts: House seats sum to ${voting}, expected 435`);
