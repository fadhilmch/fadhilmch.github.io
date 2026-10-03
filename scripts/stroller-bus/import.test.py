import importlib.util,io,zipfile,tempfile,json,gzip,unittest
from datetime import date
s=importlib.util.spec_from_file_location('gtfs','scripts/stroller-bus/import_gtfs.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class ImportTest(unittest.TestCase):
 def test_service_exceptions_and_exclusion(self):
  tables={
   'routes.txt':'route_id,route_type,route_short_name,route_long_name\nbad,700,4,\ngood,700,53,\nrail,2,10,\n',
   'trips.txt':'route_id,trip_id,service_id\nbad,bad,s\ngood,good,s\nrail,rail,s\n',
   'stops.txt':'stop_id,stop_name,stop_lat,stop_lon\na,A,59.3,18.0\nb,B,59.4,18.1\n',
   'stop_times.txt':'trip_id,stop_id,stop_sequence,arrival_time,departure_time,pickup_type,drop_off_type\ngood,a,1,25:00:00,25:00:00,0,1\ngood,b,2,25:10:00,25:10:00,1,0\n',
   'calendar_dates.txt':'service_id,date,exception_type\ns,20261003,1\ns,20261004,2\n'}
  memory=io.BytesIO()
  with zipfile.ZipFile(memory,'w') as z:
   for name,body in tables.items():z.writestr(name,body)
  memory.seek(0)
  with tempfile.TemporaryDirectory() as out,zipfile.ZipFile(memory) as z:
   m.build(z,out,date(2026,10,3),2)
   d=json.loads(gzip.decompress(open(out+'/2026-10-04.json.gz','rb').read()))
   self.assertEqual(len(d['trips']),1);self.assertEqual(d['trips'][0]['line'],'53');self.assertEqual(d['trips'][0]['calls'][0]['departure'],3600)
 def test_time(self):self.assertEqual(m.seconds('26:30:00'),95400)
if __name__=='__main__':unittest.main()
