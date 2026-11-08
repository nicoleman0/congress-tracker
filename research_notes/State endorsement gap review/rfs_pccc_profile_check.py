"""Inspect selected public profiles to review identity/year discrepancies."""
import concurrent.futures,csv,datetime,html,json,re,urllib.request
from pathlib import Path
BASE=Path(__file__).resolve().parent
cards=list(csv.DictReader((BASE/'rfs_pccc_directory_cards.tsv').open(),delimiter='\t'))
names=['Aysha Dominguez Pamukcu','Mallory Craig-Karim','Hannah Sabio-Howell','Emilia Cortez','Neil Manimala','Matthew Crowley','Rep. Torrey C. Harris','Kofi Osei','Taylor Rehmet','Markia Bordeaux','Kyandra Darling','Joanna Whaley','Justice Horn','Ashanti Martinez','Zohaib Qadri','Racquel Armstrong','Odus Evbagharu','Amanda Treppa','Victor Sims','Katie Brennan','Brandon Saffold','Balvir Singh']
selected={r['profile_url']:r for r in cards if r['name'] in names}
def fetch(item):
 u,r=item
 try:
  t=urllib.request.urlopen(u,timeout=30).read().decode();text=html.unescape(re.sub('<[^>]+>',' ',t));text=re.sub(r'\s+',' ',text)
  title=html.unescape(re.sub('<[^>]+>','',re.search(r'<h1[^>]*>(.*?)</h1>',t,re.S)[1]))
  years=sorted(set(re.findall(r'20\d{2} Endorsement',text)))
  return {'name':title,'card_name':r['name'],'card_office':r['office'],'card_year':r['directory_year'],'profile_endorsement_years':' | '.join(years),'profile_url':u,'retrieved_at':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),'status':'retrieved'}
 except Exception as e:return {'name':r['name'],'profile_url':u,'status':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:rows=list(ex.map(fetch,selected.items()))
fields=['name','card_name','card_office','card_year','profile_endorsement_years','profile_url','retrieved_at','status']
with (BASE/'rfs_pccc_profile_checks.tsv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=fields,delimiter='\t');w.writeheader();w.writerows(rows)
for r in rows:print(r['name'],r.get('card_year'),r.get('profile_endorsement_years'),r['status'])
