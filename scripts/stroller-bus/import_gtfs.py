"""Download once and build daily bus-only schedules. Never print the secret-bearing URL."""
import csv, io, json, gzip, os, sys, zipfile, urllib.request, urllib.error
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from pathlib import Path

def seconds(value):
    h,m,s=map(int,value.split(':'))
    if h<0 or m not in range(60) or s not in range(60): raise ValueError('Invalid GTFS time')
    return h*3600+m*60+s

def permitted(route):
    kind=int(route['route_type'])
    # Use agency's preferred long name when present; check both names for numeric exclusions.
    names=[route.get('route_short_name','').strip(),route.get('route_long_name','').strip()]
    return (kind==3 or 700<=kind<=716) and not any(n.isdigit() and 1<=int(n)<=6 for n in names)

def build(archive,out,start,days=3):
    def rows(name):
        if name not in archive.namelist(): return []
        return csv.DictReader(io.TextIOWrapper(archive.open(name),encoding='utf-8-sig',newline=''))
    routes={r['route_id']:r for r in rows('routes.txt') if permitted(r)}
    trips={t['trip_id']:t for t in rows('trips.txt') if t['route_id'] in routes}
    stops={s['stop_id']:s for s in rows('stops.txt') if s.get('stop_lat') and s.get('stop_lon')}
    calls={t:[] for t in trips}
    for c in rows('stop_times.txt'):
        if c['trip_id'] in calls and c['stop_id'] in stops:
            if not c.get('arrival_time') or not c.get('departure_time'): raise ValueError('Missing timetable time, interpolation not supported')
            calls[c['trip_id']].append((int(c['stop_sequence']),c['stop_id'],seconds(c['arrival_time']),seconds(c['departure_time']),c.get('pickup_type','0')=='1',c.get('drop_off_type','0')=='1'))
    for t in list(trips):
        calls[t].sort()
        if len(calls[t])<2: del trips[t]; continue
        for i,c in enumerate(calls[t]):
            if c[2]>c[3] or (i and c[2]<calls[t][i-1][3]): raise ValueError('Non-monotonic timetable')
    used={c[1] for t in trips for c in calls[t]}
    ids=sorted(used);idx={s:i for i,s in enumerate(ids)}
    service={}
    for c in rows('calendar_dates.txt'):
        service[(c['service_id'],c['date'])]=c['exception_type']=='1'
    calendars=list(rows('calendar.txt'))
    def active(s,date):
        datekey=date.strftime('%Y%m%d'); key=(s,datekey)
        if key in service:return service[key]
        weekday=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'][date.weekday()]
        return any(c['service_id']==s and c['start_date']<=datekey<=c['end_date'] and c.get(weekday)=='1' for c in calendars)
    walks=[];rules=[];restricted=0;mintransfer={}
    for x in rows('transfers.txt'):
        if x.get('from_trip_id') or x.get('to_trip_id') or x.get('from_route_id') or x.get('to_route_id'):
            # Count only restrictions which can apply to retained trips/routes.
            if x.get('from_trip_id') and x['from_trip_id'] not in trips: continue
            if x.get('to_trip_id') and x['to_trip_id'] not in trips: continue
            if x.get('from_route_id') and x['from_route_id'] not in routes: continue
            if x.get('to_route_id') and x['to_route_id'] not in routes: continue
            if x['from_stop_id'] not in idx or x['to_stop_id'] not in idx:continue
            rules.append({'from':idx[x['from_stop_id']],'to':idx[x['to_stop_id']],
                'fromTrip':x.get('from_trip_id') or None,'toTrip':x.get('to_trip_id') or None,
                'fromRoute':x.get('from_route_id') or None,'toRoute':x.get('to_route_id') or None,
                'type':int(x.get('transfer_type') or 0),'seconds':int(x.get('min_transfer_time') or 0)})
            continue
        f=x['from_stop_id'];t=x['to_stop_id']
        if f not in idx or t not in idx:continue
        kind=int(x.get('transfer_type') or 0)
        if kind==3:continue
        if kind not in (0,1,2):raise ValueError('Unsupported transfer type')
        duration=int(x.get('min_transfer_time') or 120)
        if f==t:mintransfer[f]=max(mintransfer.get(f,120),duration)
        else:walks.append({'from':idx[f],'to':idx[t],'seconds':max(duration,120)})
    # Do not silently discard trip/route transfer restrictions. This first validation detects them.
    if any(r['type'] not in (0,1,2,3) for r in rules):raise ValueError('Unsupported trip-specific transfer type')
    frequencies=list(rows('frequencies.txt'))
    if any(f['trip_id'] in trips for f in frequencies):raise ValueError('Frequency-based bus trips require expansion')
    stopdata=[{'id':s,'name':stops[s]['stop_name'],'lat':float(stops[s]['stop_lat']),'lon':float(stops[s]['stop_lon']),'minTransfer':mintransfer.get(s,120)} for s in ids]
    out=Path(out);out.mkdir(parents=True,exist_ok=True);manifest={'builtAt':datetime.now(ZoneInfo('Europe/Stockholm')).isoformat(),'source':'Trafiklab SL GTFS Regional Static','dates':[],'stops':len(ids),'routes':len(routes)}
    for n in range(days):
        date=start+timedelta(days=n);daytrips=[]
        for offset in (-1,0):
            service_date=date+timedelta(days=offset)
            for tid,t in trips.items():
                if not active(t['service_id'],service_date):continue
                cs=calls[tid];shift=offset*86400
                if cs[-1][2]+shift<0:continue
                r=routes[t['route_id']];line=r.get('route_long_name') or r.get('route_short_name')
                daytrips.append({'id':tid+':'+service_date.isoformat(),'line':line,'baseId':tid,'route':t['route_id'],'calls':[{'stop':idx[c[1]],'arrival':c[2]+shift,'departure':c[3]+shift,'pickup':not c[4],'dropoff':not c[5]} for c in cs]})
        key=date.isoformat();payload=json.dumps({'date':key,'stops':stopdata,'walks':walks,'rules':rules,'trips':daytrips},separators=(',',':')).encode()
        if len(payload)>100_000_000:raise ValueError('Daily JSON exceeds 100 MB safety limit')
        compressed=gzip.compress(payload);(out/(key+'.json.gz')).write_bytes(compressed)
        manifest['dates'].append({'date':key,'file':key+'.json.gz','bytes':len(compressed),'decodedBytes':len(payload),'trips':len(daytrips)})
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2))
    print(json.dumps(manifest,indent=2))

if __name__=='__main__':
    try:
        key=os.environ.get('TRAFIKLAB_GTFS_KEY')
        if not key:raise ValueError('TRAFIKLAB_GTFS_KEY missing')
        req=urllib.request.Request('https://opendata.samtrafiken.se/gtfs/sl/sl.zip?key='+urllib.parse.quote(key),headers={'Accept-Encoding':'gzip','User-Agent':'StrollerBusValidation/1.0'})
        with urllib.request.urlopen(req,timeout=120) as response:
            content=response.read(300_000_001)
            if response.headers.get('Content-Encoding')=='gzip':content=gzip.decompress(content)
        if len(content)>300_000_000:raise ValueError('Feed archive exceeds size limit')
        print('Archive bytes:',len(content))
        with zipfile.ZipFile(io.BytesIO(content)) as archive:build(archive,sys.argv[1],datetime.now(ZoneInfo('Europe/Stockholm')).date())
    except urllib.error.HTTPError as e:
        print('Feed request HTTP status:',e.code,file=sys.stderr);sys.exit(1)
    except Exception as e:
        print(type(e).__name__+': '+str(e).replace(os.environ.get('TRAFIKLAB_GTFS_KEY','NEVERMATCH'), '[redacted]'),file=sys.stderr);sys.exit(1)
