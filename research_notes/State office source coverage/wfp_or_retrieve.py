"""Read-only WFP source audit. Prints counts; does not change application data.
Replay the site's published load-more request to avoid counting only visible rows.
"""
import concurrent.futures
import html
import json
import re
import urllib.parse
import urllib.request

PAGE = 'https://www.workingfamilies.org/candidates/'
AJAX = 'https://workingfamilies.org/wp-admin/admin-ajax.php'

def get(url, data=None):
    request = urllib.request.Request(url, data=data, headers={'User-Agent': 'Mozilla/5.0', 'Referer': PAGE})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode()

def plain(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]*>', ' ', value))).strip()

def candidates(body):
    return [(plain(name), plain(office)) for name, office in re.findall(
        r'<td class="state-cands__name">(.*?)</td>\s*<td class="state-cands__info">(.*?)</td>', body, re.S)]

def kind(office):
    if re.search(r'\bU\.?\s?S\.?\b|\bLt\.?\b|Lieutenant', office, re.I):
        return None
    if office.strip().lower() == 'governor':
        return 'governor'
    if re.search(r'State House|State Representative|House of Delegates|House of Representatives|Texas House|State Assembly|Assembly District', office, re.I):
        return 'state_lower'
    if re.search(r'State Senate|Senate District|State Senator', office, re.I):
        return 'state_upper'
    return None

def inspect(block):
    state = plain(block.split('</h1>')[0])
    initial = candidates(block)
    if not initial:
        return None
    state_ids = re.findall(r'data-state-id="(\d+)"', block)
    extra = []
    if state_ids:
        data = urllib.parse.urlencode({'action': 'more_candidates', 'state': state_ids[0], 'count': len(initial)}).encode()
        extra = candidates(get(AJAX, data))
        if not extra:
            raise RuntimeError(f'{state}: load-more returned no parseable rows')
    return {'state': state, 'initial_rows': len(initial), 'additional_rows': len(extra),
            'in_scope_office_label_rows': sum(bool(kind(office)) for _, office in initial + extra),
            'source_url': PAGE, 'limitations': 'Office-label counts only; no cycle, result or service verification.'}

if __name__ == '__main__':
    blocks = re.split(r'<h1[^>]*>', get(PAGE))[3:]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        result = [row for row in pool.map(inspect, blocks) if row]
    print(json.dumps(result, indent=2))
