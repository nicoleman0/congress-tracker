# Gracchi

Who the progressives in Congress are, how to back them, and where to plug in locally.

Live: https://gracchi.org

## Who is listed

A member is listed if they were endorsed in 2026 by Justice Democrats, the Congressional Progressive Caucus PAC, the Working Families Party or Our Revolution, or if they currently belong to the Congressional Progressive Caucus. Every entry cites its source.

## Data

The roster is in [`data/members.json`](data/members.json). Corrections are welcome as issues or pull requests; include a source link.

Campaign links come from the website each member's committee filed with the FEC. Fill missing ones with `DATA_GOV_API_KEY=... npx tsx scripts/campaign-links.ts`.

One free api.data.gov key (https://api.data.gov/signup/) serves both the FEC and Congress.gov APIs. Scripts read it from `DATA_GOV_API_KEY`; the weekly platform job reads the repository secret of the same name.

Leading and pending races must be rechecked every 3 days. `npm run build` fails if any are stale.

## Development

```bash
npm install
npm run dev
npm test
```

## License

Code: [AGPL-3.0](LICENSE). Data: [CC BY 4.0](data/LICENSE.md).
