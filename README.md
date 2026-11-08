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

## 2028 endorsements

Kept in [`data/endorsements-2028.json`](data/endorsements-2028.json), apart from the 2026 roster, and not shown on the site yet. Each candidate is `open` (no incumbent running), `incumbent` or `challenger`, with one source URL per endorsing group.

Add one by hand after reading the group's endorsement page:

```bash
npx tsx scripts/add-endorsement.ts JD ny-10-x https://justicedemocrats.com/candidates/ \
  --name "X Person" --office house --state NY --district 10 --seat open
```

Run it again with another group code to add a second endorsement, or the same one to refresh it. There is no scraper: the groups publish in different formats, and a person has to confirm the seat is open. Endorsements not rechecked in 180 days print a warning in `npm run build`; they never fail it.

## Development

```bash
npm install
npm run dev
npm test
```

## License

Code: [AGPL-3.0](LICENSE). Data: [CC BY 4.0](data/LICENSE.md).
