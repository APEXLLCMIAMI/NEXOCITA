(()=>{
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// ─────────────────────────────────────────────────────────
// CONFIGURACIÓN: contraseña de acceso al panel
// ─────────────────────────────────────────────────────────
const PANEL_PASSWORD = 'nexocita2026';
const SESSION_KEY = 'nexocita_panel_auth';

let data, selectedDate, month, editAction, toastTimer;
const states = { confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada' };

const DEFAULT_HOURS = [
  { open:'09:00', close:'17:00', closed:false },
  { open:'09:00', close:'17:00', closed:false },
  { open:'09:00', close:'17:00', closed:false },
  { open:'09:00', close:'17:00', closed:false },
  { open:'09:00', close:'17:00', closed:false },
  { open:'09:00', close:'17:00', closed:false },
  { open:'09:00', close:'17:00', closed:true }
];

const DEFAULT_SERVICES = [
  { id:1, name:'Perfilado de barba y toalla caliente', duration:20, active:1 },
  { id:2, name:'Corte clásico de cabello', duration:30, active:1 },
  { id:3, name:'Servicio integral de estilismo', duration:50, active:1 },
  { id:4, name:'Consulta y diagnóstico profesional', duration:45, active:1 }
];

// ─────────────────────────────────────────────────────────
// CONFIG (fechas)
// ─────────────────────────────────────────────────────────
const todayStr = new Date().toISOString().split('T')[0];
const maxDateStr = new Date(Date.now() + 180*86400000).toISOString().split('T')[0];
const config = { today: todayStr, max_date: maxDateStr };

// ─────────────────────────────────────────────────────────
// HELPERS DOM
// ─────────────────────────────────────────────────────────
function el(tag, text, cls) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}
function btn(text, onclick, extra='') {
  const b = el('button', text, ('secondary-button '+extra).trim());
  b.type = 'button';
  b.onclick = onclick;
  return b;
}
function toast(msg) {
  $('#toast').textContent = msg;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>$('#toast').hidden=true, 4000);
}

// ─────────────────────────────────────────────────────────
// PERSISTENCIA LOCAL
// ─────────────────────────────────────────────────────────
function lsGet(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
  catch { return def; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function getAppts() {
  let raw = lsGet('nexocita_appointments', []);
  // seed demo si está vacío
  if (!raw.length) {
    const t = todayStr;
    const t2 = new Date(Date.now()+86400000).toISOString().split('T')[0];
    raw = [
      { appointment:{ id:'NC-582104', name:'Oliver Corrales', phone:'88992211', email:'oliver@ejemplo.com', service_name:'Perfilado de barba y toalla caliente', duration:20, date:t, time:'10:00', notes:'Cliente frecuente', status:'confirmed' }, token:'s1' },
      { appointment:{ id:'NC-914372', name:'María Rodríguez', phone:'77665544', email:'maria@ejemplo.com', service_name:'Corte clásico de cabello', duration:30, date:t, time:'14:30', notes:'', status:'confirmed' }, token:'s2' },
      { appointment:{ id:'NC-349811', name:'Carlos Mendoza', phone:'82345678', email:'carlos@ejemplo.com', service_name:'Servicio integral de estilismo', duration:50, date:t2, time:'11:00', notes:'Primera visita', status:'confirmed' }, token:'s3' }
    ];
    lsSet('nexocita_appointments', raw);
  }
  return raw.map(x => x.appointment).filter(Boolean);
}

function updateApptStatus(id, status) {
  const raw = lsGet('nexocita_appointments', []);
  const item = raw.find(x => x.appointment && x.appointment.id === id);
  if (item) { item.appointment.status = status; lsSet('nexocita_appointments', raw); }
}

function updateApptDateTime(id, date, time) {
  const raw = lsGet('nexocita_appointments', []);
  const item = raw.find(x => x.appointment && x.appointment.id === id);
  if (item) { item.appointment.date = date; item.appointment.time = time; lsSet('nexocita_appointments', raw); }
}

function getClients(appts) {
  const map = new Map();
  appts.forEach(a => {
    const k = a.phone || a.name;
    if (!map.has(k)) map.set(k, { id:map.size+1, name:a.name, phone:a.phone, email:a.email||'', visits:0 });
    const c = map.get(k); c.visits++;
    if (a.email && !c.email) c.email = a.email;
  });
  return [...map.values()];
}

function getServices()   { return lsGet('nexocita_admin_services', DEFAULT_SERVICES); }
function saveServices(v) { lsSet('nexocita_admin_services', v); }
function getHours()      { return lsGet('nexocita_admin_hours', DEFAULT_HOURS); }
function saveHours(v)    { lsSet('nexocita_admin_hours', v); }
function getBusiness()   { return localStorage.getItem('nexocita_admin_business') || 'NEXOCITA'; }
function saveBusiness(v) { localStorage.setItem('nexocita_admin_business', v); }

// ─────────────────────────────────────────────────────────
// CARGAR DATOS
// ─────────────────────────────────────────────────────────
function loadData() {
  const appts = getAppts();
  data = {
    business  : getBusiness(),
    appointments: appts,
    clients   : getClients(appts),
    services  : getServices(),
    hours     : getHours()
  };
}

// ─────────────────────────────────────────────────────────
// FORMATEAR FECHA
// ─────────────────────────────────────────────────────────
function fmt(date) {
  try { return new Intl.DateTimeFormat('es-NI',{dateStyle:'long',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')); }
  catch { return date; }
}

// ─────────────────────────────────────────────────────────
// RENDER DASHBOARD
// ─────────────────────────────────────────────────────────
function showDashboard() {
  loadData();
  $('#panel-business').textContent = data.business;
  $('#auth').hidden    = true;
  $('#dashboard').hidden = false;
  $('#logout').hidden  = false;
  renderMetrics();
  renderCalendar();
  renderAppointments();
  renderClients();
  renderServices();
  renderSettings();
}

function renderMetrics() {
  const all = data.appointments;
  const rows = [
    ['Citas para hoy',  all.filter(a=>a.date===config.today&&a.status!=='cancelled').length],
    ['Próximas citas',  all.filter(a=>a.date>=config.today&&a.status==='confirmed').length],
    ['Clientes',        data.clients.length],
    ['Completadas',     all.filter(a=>a.status==='completed').length]
  ];
  $('#metrics').replaceChildren(...rows.map(([label,val])=>{
    const c=el('div',undefined,'metric');
    c.append(el('span',label), el('strong',val));
    return c;
  }));
}

// ─── CALENDARIO ───
function renderCalendar() {
  const [y,m] = month.split('-').map(Number);
  const days   = new Date(Date.UTC(y,m,0)).getUTCDate();
  const offset = (new Date(Date.UTC(y,m-1,1)).getUTCDay()+6)%7;
  $('#calendar-month').textContent = new Intl.DateTimeFormat('es-NI',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${month}-01T12:00:00Z`));
  $('#calendar').replaceChildren(...['L','M','X','J','V','S','D'].map(d=>el('span',d)));
  for(let i=0;i<offset;i++) $('#calendar').append(el('span',''));
  for(let d=1;d<=days;d++) {
    const date=`${month}-${String(d).padStart(2,'0')}`;
    const b=el('button',d,'calendar-day');
    b.setAttribute('aria-label',fmt(date));
    if(date===selectedDate) b.classList.add('selected');
    if(date===config.today) b.classList.add('today');
    if(data.appointments.some(a=>a.date===date&&a.status!=='cancelled')) b.classList.add('has-bookings');
    b.onclick=()=>{ selectedDate=date; $('#all-dates').checked=false; renderCalendar(); renderAppointments(); };
    $('#calendar').append(b);
  }
}
function moveMonth(delta){ const d=new Date(`${month}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth()+delta); month=d.toISOString().slice(0,7); renderCalendar(); }
$('#prev-month').onclick=()=>moveMonth(-1);
$('#next-month').onclick=()=>moveMonth(1);
$('#today-button').onclick=()=>{ selectedDate=config.today; month=config.today.slice(0,7); $('#all-dates').checked=false; renderCalendar(); renderAppointments(); };

// ─── CITAS ───
function renderAppointments() {
  const q=$('#search-appointments').value.toLocaleLowerCase();
  const st=$('#status-filter').value;
  const all=$('#all-dates').checked;
  $('#agenda-title').textContent = all?'Todas las citas':fmt(selectedDate);
  const list = data.appointments.filter(a=>(all||a.date===selectedDate)&&(!st||a.status===st)&&`${a.name} ${a.phone}`.toLocaleLowerCase().includes(q));
  $('#appointments').replaceChildren();
  if(!list.length){ $('#appointments').append(el('p','No hay citas que coincidan con esta selección.','empty-state')); return; }
  list.forEach(a=>{
    const row=el('article',undefined,'appointment-row');
    const head=el('div',undefined,'appointment-heading');
    const title=el('div');
    title.append(el('h3',`${a.time} · ${a.name}`), el('p',a.service_name));
    head.append(title, el('span',states[a.status],'status '+a.status));
    row.append(head, el('p',`${fmt(a.date)} · ${a.duration} min · Tel. ${a.phone} · #${a.id}`,'row-meta'));
    if(a.notes) row.append(el('p',a.notes,'row-meta'));
    const acts=el('div',undefined,'row-actions');
    if(a.status==='confirmed') {
      acts.append(
        btn('Reprogramar',()=>editAppointment(a)),
        btn('Marcar completada',()=>{ updateApptStatus(a.id,'completed'); showDashboard(); toast('Cita marcada como completada.'); }),
        btn('Cancelar',()=>{ if(confirm(`¿Cancelar la cita de ${a.name}?`)){ updateApptStatus(a.id,'cancelled'); showDashboard(); toast('Cita cancelada.'); } },'danger-button')
      );
    }
    row.append(acts);
    $('#appointments').append(row);
  });
}
['search-appointments','status-filter','all-dates'].forEach(id=>$('#'+id).addEventListener('input',renderAppointments));

// ─── EDITOR DE CITA ───
function field(label,name,value,type='text',required=true) {
  const w=el('label',label); const inp=document.createElement('input');
  inp.name=name; inp.type=type; inp.value=value; inp.required=required; w.append(inp); return w;
}
function openEditor(title,fields,save) {
  $('#edit-title').textContent=title;
  $('#edit-fields').replaceChildren(...fields);
  $('#edit-error').textContent='';
  editAction=save;
  $('#edit-dialog').showModal();
}
function editAppointment(a) {
  const df=field('Nueva fecha','date',a.date,'date');
  const tf=field('Nueva hora','time',a.time,'time');
  df.querySelector('input').min=config.today;
  df.querySelector('input').max=config.max_date;
  tf.querySelector('input').step=900;
  openEditor('Reprogramar cita',[df,tf,el('p',`${a.service_name} · ${a.duration} min`)],values=>{
    updateApptDateTime(a.id,values.date,values.time);
    return Promise.resolve();
  });
}
$('#close-edit').onclick=()=>$('#edit-dialog').close();
$('#edit-form').onsubmit=async e=>{
  e.preventDefault();
  const save=e.submitter; save.disabled=true;
  try {
    await editAction(Object.fromEntries(new FormData(e.target)));
    $('#edit-dialog').close(); showDashboard(); toast('Cambios guardados.');
  } catch(err) { $('#edit-error').textContent=err.message; }
  finally { save.disabled=false; }
};

// ─── CLIENTES ───
function renderClients() {
  const q=$('#search-clients').value.toLowerCase();
  const list=data.clients.filter(c=>`${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(q));
  $('#clients').replaceChildren();
  if(!list.length){ $('#clients').append(el('p','Los clientes aparecerán aquí al reservar su primera cita.','empty-state')); return; }
  list.forEach(c=>{
    const card=el('article',undefined,'client-card');
    card.append(
      el('h3',c.name),
      el('p',c.phone),
      el('p',c.email||'Sin correo electrónico'),
      el('p',`${c.visits} cita(s) registradas`),
      btn('Ver citas',()=>{ $('#search-appointments').value=c.phone; $('#all-dates').checked=true; $('#status-filter').value=''; selectView('agenda'); renderAppointments(); })
    );
    $('#clients').append(card);
  });
}
$('#search-clients').oninput=renderClients;

// ─── SERVICIOS ───
function renderServices() {
  $('#services').replaceChildren(...data.services.map(s=>{
    const row=el('div',undefined,'service-row');
    const p=el('p',s.name);
    p.append(el('span',`${s.duration} minutos · ${s.active?'Activo':'Inactivo'}`));
    row.append(p, btn(s.active?'Desactivar':'Activar',()=>{
      const svcs=getServices();
      const f=svcs.find(x=>x.id===s.id);
      if(f) f.active=f.active?0:1;
      saveServices(svcs); showDashboard(); toast('Servicio actualizado.');
    }));
    return row;
  }));
}
$('#service-form').onsubmit=e=>{
  e.preventDefault();
  const vals=Object.fromEntries(new FormData(e.target));
  const svcs=getServices();
  svcs.push({ id:Date.now(), name:vals.name, duration:Number(vals.duration), active:1 });
  saveServices(svcs); e.target.reset(); showDashboard(); toast('Servicio añadido.');
};

// ─── HORARIO ───
function renderSettings() {
  $('#settings-business').value=data.business;
  $('#hours').replaceChildren(...data.hours.map((h,i)=>{
    const row=el('div',undefined,'hours-row');
    const day=el('label',undefined,'day-label');
    const chk=document.createElement('input'); chk.type='checkbox'; chk.checked=!h.closed; chk.name=`open-${i}`;
    day.append(chk, document.createTextNode(['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][i]));
    row.append(day);
    ['open','close'].forEach(k=>{
      const inp=document.createElement('input');
      inp.type='time'; inp.step=900; inp.required=true;
      inp.name=`${k}-time-${i}`; inp.value=h[k];
      inp.setAttribute('aria-label',`${k==='open'?'Apertura':'Cierre'} ${['lunes','martes','miércoles','jueves','viernes','sábado','domingo'][i]}`);
      row.append(inp);
    });
    return row;
  }));
}
$('#settings-form').onsubmit=e=>{
  e.preventDefault();
  const form=new FormData(e.target);
  const hours=Array.from({length:7},(_,i)=>({ closed:!form.has(`open-${i}`), open:form.get(`open-time-${i}`), close:form.get(`close-time-${i}`) }));
  saveBusiness(form.get('business'));
  saveHours(hours);
  showDashboard();
  toast('Cambios guardados.');
};

// ─── NAVEGACIÓN DE VISTAS ───
const viewTabs=$$('.panel-tabs button');
function selectView(view) {
  viewTabs.forEach(b=>{ const sel=b.dataset.view===view; b.setAttribute('aria-selected',String(sel)); b.tabIndex=sel?0:-1; $('#view-'+b.dataset.view).hidden=!sel; });
}
viewTabs.forEach((b,i)=>{
  b.onclick=()=>selectView(b.dataset.view);
  b.onkeydown=e=>{ let j; if(e.key==='ArrowRight')j=(i+1)%viewTabs.length; if(e.key==='ArrowLeft')j=(i+viewTabs.length-1)%viewTabs.length; if(j!==undefined){ e.preventDefault(); viewTabs[j].focus(); selectView(viewTabs[j].dataset.view); } };
});

// ─────────────────────────────────────────────────────────
// AUTENTICACIÓN (contraseña fija, sin backend)
// ─────────────────────────────────────────────────────────
$('#auth-form').onsubmit=e=>{
  e.preventDefault();
  $('#auth-error').textContent='';
  $('#auth-submit').disabled=true;
  const pass=Object.fromEntries(new FormData(e.target)).password||'';
  if(pass!==PANEL_PASSWORD){
    $('#auth-error').textContent='Contraseña incorrecta.';
    $('#auth-submit').disabled=false;
    return;
  }
  sessionStorage.setItem(SESSION_KEY,'1');
  e.target.reset();
  selectedDate=config.today;
  month=config.today.slice(0,7);
  showDashboard();
  $('#auth-submit').disabled=false;
};

$('#logout').onclick=()=>{
  sessionStorage.removeItem(SESSION_KEY);
  $('#auth').hidden=false;
  $('#dashboard').hidden=true;
  $('#logout').hidden=true;
};

$('#refresh').onclick=()=>{ showDashboard(); toast('Agenda actualizada.'); };

// ─────────────────────────────────────────────────────────
// INICIALIZACIÓN
// ─────────────────────────────────────────────────────────
// Asegurarse de que global-error nunca muestre nada al cargar
$('#global-error').textContent='';

selectedDate=config.today;
month=config.today.slice(0,7);

// Si ya hay sesión activa, abrir dashboard directamente
if(sessionStorage.getItem(SESSION_KEY)==='1'){
  showDashboard();
}
})();
