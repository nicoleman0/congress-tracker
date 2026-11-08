"""Audit public source identities; does not import application data."""
import concurrent.futures,csv,datetime,html,json,re,unicodedata,urllib.request
from collections import Counter,defaultdict
from html.parser import HTMLParser
from pathlib import Path
BASE=Path(__file__).resolve().parent
STATES=dict(re.findall(r'\["([A-Z]{2})", "([^"]+)", \d+\]',(BASE.parents[1]/'lib/states.ts').read_text()))
NAMES={v:k for k,v in STATES.items()};NAMES['District of Columbia']='DC'
class Blocks(HTMLParser):
 def __init__(self):super().__init__();self.lines=[];self.tag=None;self.depth=0;self.buf=[]
 def handle_starttag(self,t,a):
  if self.tag:
   if t==self.tag:self.depth+=1
   if t=='br':self.buf.append('\n')
  elif t in ['p','li','h2','h3','h4']:self.tag=t;self.depth=1;self.buf=[]
 def handle_endtag(self,t):
  if t==self.tag:
   self.depth-=1
   if self.depth==0:
    self.lines.extend(x.strip() for x in ''.join(self.buf).split('\n') if x.strip());self.tag=None
 def handle_data(self,x):
  if self.tag:self.buf.append(x)
ACCESS_FAILURES=[]
def get(u):
 for attempt in range(3):
  try:
   req=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'})
   with urllib.request.urlopen(req,timeout=30) as r:return r.read().decode()
  except Exception as exc:
   ACCESS_FAILURES.append({'url':u,'attempt':attempt+1,'error':str(exc)})
   if attempt==2:raise
def norm(s):
 s=re.sub(r'^(?:Dr\.?|Mr\.?|Ms\.?)\s+', '', s)
 return re.sub('[^a-z0-9]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
def legislative(role):
 r=re.sub(r'\s+',' ',role).strip()
 for n in sorted(NAMES,key=len,reverse=True):
  if r.startswith(n+' '):r=r[len(n):].strip();break
 r=re.sub('^State ','',r)
 return bool(re.match(r'^(House|Senate|Senator|Representative|Assembly|General Assembly|Delegate|Legislature|Legislative)',r))
def legacy(role):
 r=re.sub(r'\s+',' ',role).strip()
 for n in NAMES:
  if r.startswith(n+' '):r=r[len(n):].strip();break
 r=re.sub('^State ','',r)
 return bool(re.match(r'^(House|Senate|Senator|Representative|Assembly|Delegate|Legislature|Legislative)',r))
assert legislative('General Assembly, District 32, NJ') and not legacy('General Assembly, District 32, NJ')
assert legislative('Nebraska Legislature, District 7, NE')
assert legislative('West Virginia House of Delegates, District 1, WV')
assert not legislative('County Legislature, District 1, NY')

def directory(y):
 u=f'https://directory.runforsomething.net/candidates/{y}/';t=get(u);rows=[]
 pat=r'<a href="(/candidate/[^\"]+)"[^>]*>\s*<div class="candidate__name">(.*?)</div><div class="candidate__office-state">(.*?)</div>'
 for path,name,role in re.findall(pat,t,re.S):
  clean=lambda x:html.unescape(re.sub('<[^>]+>','',x)).strip()
  name,role=clean(name),clean(role);m=re.search(',\\s*([A-Z]{2})$',role)
  rows.append({'name':name,'office':role,'state':m[1] if m else '', 'profile_url':'https://directory.runforsomething.net'+path,'directory_year':y,'in_scope':legislative(role),'legacy_in_scope':legacy(role),'source_url':u})
 return rows

def release(item):
 u,title=item
 try:
  t=get(u);b=Blocks();b.feed(t)
  state=None;rows=[];started=False
  for line in b.lines:
   l=re.sub(r'\s+',' ',line).strip()
   if l.casefold() in {k.casefold():v for k,v in NAMES.items()}:state={k.casefold():v for k,v in NAMES.items()}[l.casefold()];started=True;continue
   if started and (l.startswith('###') or l.startswith('Be the first')):break
   if started and (l.startswith('Run for Something (RFS)') or l.startswith('Run For Something (RFS)')):break
   if state and ',' in l and len(l)<260 and not any(x in l for x in ['[email','FOR IMMEDIATE','Learn more','Copyright','Paid for','Contact:']):
    name,role=l.split(',',1)
    if re.match(r'^\s*(?:Jr\.?|Esq\.?),',role):
     suffix,role=role.split(',',1);name += ', '+suffix.strip()
    if len(name)<65 and len(name.split())<9:
     rows.append({'name':name.strip(),'office':role.strip(),'state':state,'in_scope':legislative(role.strip()),'source_url':u})
  text=html.unescape(re.sub('<[^>]+>',' ',t));text=re.sub(r'\s+',' ',text)
  date=re.search(r'Date:\s*(.{0,60}?)(?:Contact:|Run [Ff]or Something)',text)
  cumulative=re.findall(r'.{0,45}(?:now endorsed|total of|brings the total).{0,120}',text)
  return {'url':u,'title':title,'date':date[1].strip() if date else '', 'parsed_rows':rows,'cumulative_claims':cumulative}
 except Exception as e:return {'url':u,'title':title,'error':str(e),'parsed_rows':[]}
press=get('https://runforsomething.net/rfs-press/')
links=[]
for a,l in re.findall(r'<a[^>]*href=[\"\']([^\"\']+)[\"\'][^>]*>(.*?)</a>',press,re.S):
 title=html.unescape(re.sub('<[^>]+>','',l)).strip()
 if 'ndors' in title and '/rfs-press/' in a and 'criteria' not in a:links.append((a,title))
links.append(('https://runforsomething.net/rfs-press/https-runforsomething-net-rfs-press-june2026-endorsements/', 'Corrected June 2 2026 endorsement release'))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
 dirs=dict(zip(range(2020,2027),ex.map(directory,range(2020,2027))))
 releases=list(ex.map(release,links))
result={'access_failures':ACCESS_FAILURES,'retrieved_at':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),'method':'Public HTML with Mozilla/5.0 user-agent; derived factual card/announcement comparison only. Release parsing is candidate name/state comparison; role differences require review.','directory_counts':{},'release_summaries':[]}
for y,rows in dirs.items():
 result['directory_counts'][y]={'all_cards':len(rows),'legacy_legislative_cards':sum(r['legacy_in_scope'] for r in rows),'corrected_legislative_cards':sum(r['in_scope'] for r in rows),'corrected_states':sorted({r['state'] for r in rows if r['in_scope']}),'classifier_additions':[r for r in rows if r['in_scope'] and not r['legacy_in_scope']]}
for p in releases:
 result['release_summaries'].append({k:v for k,v in p.items() if k!='parsed_rows'}|{'parsed_cards':len(p['parsed_rows']),'parsed_legislative_cards':sum(r['in_scope'] for r in p['parsed_rows'])})
(BASE/'rfs_pccc_reconciliation_summary.json').write_text(json.dumps(result,indent=2)+'\n')
allrows=[r for rows in dirs.values() for r in rows]
fields=['directory_year','name','office','state','in_scope','legacy_in_scope','profile_url','source_url']
with (BASE/'rfs_pccc_directory_cards.tsv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=fields,delimiter='\t');w.writeheader();w.writerows(allrows)
with (BASE/'rfs_pccc_release_rows.tsv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=['release_date','name','office','state','in_scope','source_url'],delimiter='\t');w.writeheader()
 for p in releases:
  for r in p['parsed_rows']:w.writerow({'release_date':p.get('date',''),**r})
# Compare all retrieved release rows to the 2026 directory using normalized name+state, preserving original office wording.
d26=defaultdict(list)
for r in dirs[2026]:d26[(norm(r['name']),r['state'])].append(r)
recon=[]
for p in releases:
 for r in p['parsed_rows']:
  matches=d26.get((norm(r['name']),r['state']),[])
  recon.append({'name':r['name'],'state':r['state'],'release_office':r['office'],'release_date':p.get('date',''),'release_in_scope':r['in_scope'],'directory_2026_match':bool(matches),'directory_office':' | '.join(x['office'] for x in matches),'profile_url':' | '.join(x['profile_url'] for x in matches),'release_url':p['url']})
with (BASE/'rfs_pccc_release_directory_comparison.tsv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=list(recon[0]),delimiter='\t');w.writeheader();w.writerows(recon)
print(json.dumps(result,indent=2))
print('comparison',len(recon),'rows',Counter((r['release_date'],r['directory_2026_match']) for r in recon))
