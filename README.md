# Progressive Bloc

Who the progressives in Congress are, how to back them, and where to plug in locally.

Live: https://congress-tracker-tawny-one.vercel.app

## Who is listed

A member is listed if they were endorsed in 2026 by Justice Democrats, the Congressional Progressive Caucus PAC, the Working Families Party or Our Revolution, or if they currently belong to the Congressional Progressive Caucus. Every entry cites its source.

## Data

The roster is in [`data/members.json`](data/members.json). Corrections are welcome as issues or pull requests; include a source link.

Campaign links come from the website each member's committee filed with the FEC. Fill missing ones with `FEC_API_KEY=... npx tsx scripts/campaign-links.ts` (free key at https://api.data.gov/signup/).

Leading and pending races must be rechecked every 3 days. `npm run build` fails if any are stale.

## Development

```bash
npm install
npm run dev
npm test
```

## License

Code: [AGPL-3.0](LICENSE). Data: [CC BY 4.0](data/LICENSE.md).
