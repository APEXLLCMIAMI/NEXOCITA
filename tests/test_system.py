import sys,tempfile,threading,json,unittest,urllib.request,urllib.error,http.cookiejar,time,concurrent.futures
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server
class Flow(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.temp=tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1] / "data");server.DB_PATH=Path(cls.temp.name)/'test.sqlite3';server.init_db();cls.http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler);threading.Thread(target=cls.http.serve_forever,daemon=True).start();cls.base='http://127.0.0.1:'+str(cls.http.server_port);cls.admin=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 @classmethod
 def tearDownClass(cls): cls.http.shutdown();cls.http.server_close()
 def req(self,path,body=None,method=None,admin=False):
  q=urllib.request.Request(self.base+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json'},method=method)
  try:r=(self.admin if admin else urllib.request.build_opener()).open(q)
  except urllib.error.HTTPError as e:r=e
  raw=r.read()
  try:data=json.loads(raw)
  except:data=raw.decode(errors='replace')
  return r.status,data
 def test_complete_flow(self):
  checks=[]
  def ck(name,condition):self.assertTrue(condition,name);checks.append(name)
  ck('Admin sin sesión rechazado',self.req('/api/admin/data')[0]==401)
  ck('Configuración inicial',self.req('/api/setup',{'business':'NEXOCITA Demo','password':'PruebaLocal2026!'},admin=True)[0]==200)
  ck('Configuración duplicada rechazada',self.req('/api/setup',{'business':'Otra','password':'PruebaLocal2026!'})[0]==409)
  ck('Contraseña incorrecta rechazada',self.req('/api/login',{'password':'Incorrecta2026'})[0]==401)
  cfg=self.req('/api/config')[1];service=cfg['services'][0]['id'];day=server.now_local().date()+server.timedelta(days=1)
  while day.weekday()==6:day+=server.timedelta(days=1)
  date=day.isoformat();slots=self.req(f'/api/availability?date={date}&service={service}')[1]['slots'];ck('Consulta de disponibilidad',len(slots)>0)
  body={'name':'Cliente Prueba','phone':'88880000','email':'demo@example.test','service':service,'date':date,'time':slots[0]}
  ck('Correo inválido rechazado',self.req('/api/book',dict(body,email='mal'))[0]==400)
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: results=list(pool.map(lambda _:self.req('/api/book',body),range(2)))
  ck('Concurrencia sin doble reserva',sorted(r[0] for r in results)==[201,409]);receipt=next(r[1] for r in results if r[0]==201);aid=receipt['appointment']['id'];secret=receipt['token']
  ck('Consulta protegida',self.req('/api/my-appointment',{'id':aid,'token':'incorrecta'})[0]==403)
  ck('Consulta de reserva',self.req('/api/my-appointment',{'id':aid,'token':secret})[1]['status']=='confirmed')
  ck('Reprogramación',self.req('/api/admin/appointment',{'id':aid,'date':date,'time':slots[-1]},'PATCH',True)[0]==200)
  ck('Cancelación del cliente',self.req('/api/my-appointment',{'id':aid,'token':secret,'cancel':True})[1]['status']=='cancelled')
  ck('Horario liberado',slots[-1] in self.req(f'/api/availability?date={date}&service={service}')[1]['slots'])
  ck('Alta de servicio',self.req('/api/admin/service',{'name':'Servicio prueba','duration':45},admin=True)[0]==201)
  data=self.req('/api/admin/data',admin=True)[1];sid=data['services'][-1]['id'];cid=data['clients'][0]['id']
  ck('Desactivar servicio',self.req('/api/admin/service',{'id':sid,'active':False},'PATCH',True)[0]==200 and sid not in [s['id'] for s in self.req('/api/config')[1]['services']])
  ck('Editar cliente',self.req('/api/admin/client',{'id':cid,'name':'Cliente editado','email':'edit@example.test'},'PATCH',True)[0]==200)
  hours=cfg['hours'];ck('Guardar horario',self.req('/api/admin/settings',{'business':'NEXOCITA Demo','hours':hours},'PATCH',True)[0]==200)
  bad=[dict(h) for h in hours];bad[0]['open']='09:99';ck('Hora inválida rechazada',self.req('/api/admin/settings',{'business':'NEXOCITA Demo','hours':bad},'PATCH',True)[0]==400)
  r=self.req('/api/book',dict(body,time=slots[0]))[1];ck('Nueva reserva tras liberar',bool(r.get('appointment')))
  ck('Completar cita',self.req('/api/admin/appointment',{'id':r['appointment']['id'],'status':'completed'},'PATCH',True)[0]==200)
  ck('Archivos privados inaccesibles',all(self.req(p)[0]==404 for p in ['/server.py','/data/nexocita.sqlite3','/.git/config','/assets/../server.py']))
  ck('HTML disponible',self.req('/index.html')[0]==200)
  ck('JSON no objeto rechazado',self.req('/api/login',[])[0]==400)
  times=[]
  for _ in range(20):
   start=time.perf_counter();self.req('/api/config');times.append((time.perf_counter()-start)*1000)
  ck('Logout',self.req('/api/logout',{},admin=True)[0]==200 and self.req('/api/admin/data',admin=True)[0]==401)
  report={'checks':checks,'passed':len(checks),'config_ms_mean':round(sum(times)/len(times),2),'config_ms_max':round(max(times),2),'requests':20,'environment':'HTTP local Windows; SQLite temporal; sin carga externa'}
  Path(__file__).resolve().parents[1].joinpath('docs/qa-resultados.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':unittest.main()

