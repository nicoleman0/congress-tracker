"""Reproduce page-level source counts for the 2026-11-08 audit, not a roster import."""
import concurrent.futures
import csv
import datetime
import html
import json
import re
import urllib.request
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

BASE = Path(__file__).resolve().parent
STATE_ROWS = re.findall(r'\["([A-Z]{2})", "([^"]+)", \d+\]', (BASE.parents[1] / 'lib/states.ts').read_text())
STATES = dict(STATE_ROWS)
NAMES = {v: k for k, v in STATE_ROWS}
NAMES['Deleware'] = 'DE'

class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.lines = []
    def handle_data(self, text):
        if text.strip():
            self.lines.append(text.strip())

def legislative(role):
    role = re.sub(r'\s+', ' ', role).strip()
    for name in NAMES:
        if role.startswith(name + ' '):
            role = role[len(name):].strip()
            break
    role = re.sub(r'^State ', '', role)
    return bool(re.match(r'^(House|Senate|Senator|Representative|Assembly|Delegate|Legislature|Legislative)', role))

def fetch(spec):
    group, year, url, kind = spec
    try:
        res = urllib.request.urlopen(url, timeout=30)
        raw = res.read().decode()
        text = Text()
        text.feed(raw)
        row = {'organization': group, 'year': year, 'url': url, 'kind': kind, 'http_status': res.status,
               'retrieved_at': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')}
        counts = Counter()
        if kind == 'rfs_year_directory':
            roles = [html.unescape(re.sub('<[^>]+>', '', r)) for r in re.findall(r'<div class="candidate__office-state">(.*?)</div>', raw)]
            selected = [r for r in roles if legislative(r)]
            for role in selected:
                state = re.search(r',\s*([A-Z]{2})$', role)
                if state and state[1] in STATES:
                    counts[state[1]] += 1
            row.update(all_cards=len(roles), state_legislative_cards=len(selected), state_counts=dict(counts),
                       governor_cards=sum(bool(re.match(r'^Governor', r)) for r in roles))
        elif kind == 'pccc_champions':
            unmatched = []
            for i, role in enumerate(text.lines[:-1]):
                if not legislative(role):
                    continue
                loc = text.lines[i + 1]
                match = re.match(r'^([A-Z]{2})-', loc)
                state = match[1] if match else next((code for name, code in NAMES.items() if loc.startswith(name)), None)
                if state:
                    counts[state] += 1
                else:
                    unmatched.append({'office': role, 'location': loc})
            row.update(state_counts=dict(counts), state_legislative_cards=sum(counts.values()), unmatched_locations=unmatched,
                       endorsement_word_present=bool(re.search('endorse', raw, re.I)))
        elif kind == 'pccc_current_endorsements':
            row.update(state_counts={}, in_scope_offices_found=False)
        return row
    except Exception as exc:
        return {'organization':group,'year':year,'url':url,'kind':kind,'error':str(exc)}

specs = [('RFS', y, f'https://directory.runforsomething.net/candidates/{y}/', 'rfs_year_directory') for y in range(2020, 2027)]
specs += [('PCCC', y, f'https://www.boldprogressives.org/{y}-champions/', 'pccc_champions') for y in range(2020, 2024)]
specs += [('PCCC', y, f'https://www.boldprogressives.org/candidates/our-endorsements-{y}/', 'pccc_current_endorsements') for y in [2024,2026]]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    pages = list(pool.map(fetch, specs))
(BASE / 'rfs_pccc_source_counts.json').write_text(json.dumps({'accessed':'2026-11-08', 'method':'Direct HTTPS HTML inspection; source-card aggregates, not eligible or unique officials. PCCC champions require endorsement semantics confirmation. RFS cards require reconciliation against dated release totals.', 'pages': pages}, indent=2) + '\n')

with (BASE / 'rfs_pccc_coverage.tsv').open('w') as f:
    writer = csv.writer(f, delimiter='\t')
    writer.writerow(['state','organization','status','years','offices','source_urls','gaps'])
    for group in ['RFS','PCCC']:
        for state in sorted(STATES):
            found = [p for p in pages if p['organization']==group and p.get('state_counts',{}).get(state)]
            if group == 'RFS':
                status = 'verified_in_scope_source' if found else 'not_established'
                gaps = 'State legislative endorsement-source availability only; no service/outcome verification; year directories not reconciled against all dated releases; no gubernatorial scope established historically.'
                if not found:
                    gaps += ' No legislative card established in inspected 2020-2026 year directories; this does not prove no endorsement.'
                urls = [p['url'] for p in found] or ['https://directory.runforsomething.net/candidates/']
            else:
                status = 'not_established'
                gaps = 'Official champions lists are discovery leads: explicit endorsement meaning not established; 2024 and 2026 inspected endorsement pages have no in-scope office; no complete 2024-2026 state/local archive established; no current service/outcomes verified.'
                urls = [p['url'] for p in found] + ['https://www.boldprogressives.org/candidates/our-endorsements-2026/']
            writer.writerow([state, group, status, ','.join(str(p['year']) for p in found), 'state_legislature' if found else '', ' | '.join(urls), gaps])
print('RFS source states:', sorted({s for p in pages if p['organization']=='RFS' for s in p.get('state_counts',{})}))
for p in pages:
    print(p['organization'],p['year'],p.get('all_cards'),p.get('state_legislative_cards'),len(p.get('state_counts',{})),p.get('error',''))
