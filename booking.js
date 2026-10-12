(()=>{
const $=s=>document.querySelector(s);let config,receipt,slotRequest=0;
async function api(path,body){const r=await fetch('/api/'+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});let data;try{data=await r.json()}catch{throw Error('El sistema de reservas no está disponible. Comprueba que el servidor esté activo.')}if(!r.ok)throw Error(data.error||'No se pudo completar la solicitud.');return data}
const format=date=>new Intl.DateTimeFormat('es-NI',{dateStyle:'long',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
async function slots(){const request=++slotRequest;$('#selected-time').value='';$('#confirm-booking').disabled=true;$('#booking-summary').textContent='Selecciona un horario para continuar.';$('#slots').replaceChildren();const date=$('#date').value,service=$('#service').value;if(!date||!service)return;$('#slots').textContent='Consultando disponibilidad…';try{const data=await api(`availability?date=${encodeURIComponent(date)}&service=${encodeURIComponent(service)}`);if(request!==slotRequest)return;$('#slots').replaceChildren();if(!data.slots.length){$('#slots').textContent='No hay horarios disponibles para esta fecha. Prueba otro día.';return}data.slots.forEach(time=>{const b=document.createElement('button');b.type='button';b.className='slot';b.textContent=time;b.setAttribute('aria-pressed','false');b.onclick=()=>{$$('#slots button').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');$('#selected-time').value=time;$('#confirm-booking').disabled=config.setup_required;$('#booking-summary').textContent=`${$('#service').selectedOptions[0].textContent} · ${format(date)} · ${time}`};$('#slots').append(b)})}catch(e){if(request===slotRequest)$('#slots').textContent=e.message}}
function $$(s){return [...document.querySelectorAll(s)]}
$('#service').onchange=slots;$('#date').onchange=slots;
$('#booking-form').onsubmit=async e=>{e.preventDefault();$('#booking-error').textContent='';const values=Object.fromEntries(new FormData(e.target));if(!values.time){$('#booking-error').textContent='Selecciona un horario.';return}$('#confirm-booking').disabled=true;try{receipt=await api('book',values);$('#booking-form').hidden=true;$('#booking-success').hidden=false;const a=receipt.appointment;$('#receipt-details').textContent=`${a.service_name} · ${format(a.date)} · ${a.time} (${a.duration} min) · ${a.name}`;$('#receipt-codes').replaceChildren();[['Código de reserva',a.id],['Clave de consulta',receipt.token]].forEach(([label,value])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;$('#receipt-codes').append(dt,dd)});$('#booking-success').scrollIntoView({block:'center',behavior:'smooth'})}catch(error){$('#booking-error').textContent=error.message;await slots()}};
$('#new-booking').onclick=()=>{$('#booking-success').hidden=true;$('#booking-form').hidden=false;$('#booking-form').reset();$('#date').value=config.today;slots()};
$('#download-receipt').onclick=()=>{const a=receipt.appointment;const body=`NEXOCITA · ${config.business}\n\n${a.service_name}\n${format(a.date)} a las ${a.time} (hora de Nicaragua)\nDuración: ${a.duration} minutos\nNombre: ${a.name}\n\nCódigo: ${a.id}\nClave de consulta: ${receipt.token}\n\nGuarda esta clave de forma privada. Consulta o cancela desde la sección «¿Ya tienes una cita?» del sitio.\n${location.origin}\n`;const url=URL.createObjectURL(new Blob([body],{type:'text/plain;charset=utf-8'}));const aLink=document.createElement('a');aLink.href=url;aLink.download=`cita-${a.id}.txt`;aLink.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
const statusNames={confirmed:'Confirmada',completed:'Completada',cancelled:'Cancelada'};
async function lookup(cancel=false){$('#lookup-error').textContent='';try{const payload=Object.fromEntries(new FormData($('#lookup-form')));if(cancel)payload.cancel=true;const a=await api('my-appointment',payload);const card=document.createElement('div');card.className='lookup-card';const p=document.createElement('p');p.textContent=`${a.service_name} · ${format(a.date)} · ${a.time} · ${statusNames[a.status]}`;card.append(p);if(a.status==='confirmed'){const b=document.createElement('button');b.className='secondary-button danger-button';b.textContent='Cancelar esta cita';b.onclick=()=>{if(confirm('¿Quieres cancelar esta cita y liberar el horario?'))lookup(true)};card.append(b)}$('#lookup-result').replaceChildren(card)}catch(e){$('#lookup-result').replaceChildren();$('#lookup-error').textContent=e.message}}
$('#lookup-form').onsubmit=e=>{e.preventDefault();lookup()};
api('config').then(data=>{config=data;$('#business-name').textContent=`${data.business} · Reserva en pocos pasos.`;$('#date').min=data.today;$('#date').max=data.max_date;$('#date').value=data.today;$('#service').replaceChildren();const placeholder=new Option('Selecciona un servicio','');$('#service').append(placeholder);data.services.forEach(s=>$('#service').append(new Option(`${s.name} · ${s.duration} min`,s.id)));if(data.setup_required){$('#booking-notice').textContent='Primero, el dueño debe configurar el negocio desde su panel.';$('#booking-form').inert=true}else if(!data.services.length){$('#booking-notice').textContent='El negocio todavía no tiene servicios disponibles.'}}).catch(()=>{
  const todayStr=new Date().toISOString().split('T')[0];
  config={business:'NEXOCITA Demo Local',today:todayStr,setup_required:false};
  $('#business-name').textContent='NEXOCITA Demo · Modo Interactivo Activo';
  $('#date').value=todayStr;
  $('#service').replaceChildren(
    new Option('Selecciona un servicio',''),
    new Option('Corte clásico de cabello · 30 min','1'),
    new Option('Perfilado de barba y toalla caliente · 20 min','2'),
    new Option('Servicio integral de estilismo · 50 min','3'),
    new Option('Consulta y diagnóstico profesional · 45 min','4')
  );
  $('#booking-notice').textContent='Servidor local no detectado: ejecutando en Modo Demostración Interactivo.';
  $('#slots').replaceChildren();
  ['09:00','10:15','11:30','14:00','15:15','16:30'].forEach(time=>{
    const b=document.createElement('button');b.type='button';b.className='slot';b.textContent=time;b.setAttribute('aria-pressed','false');
    b.onclick=()=>{
      $$('#slots button').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');
      $('#selected-time').value=time;$('#confirm-booking').disabled=false;
      $('#booking-summary').textContent=`${$('#service').selectedOptions[0]?.textContent||'Servicio seleccionado'} · ${format(todayStr)} · ${time}`;
    };
    $('#slots').append(b);
  });
});
})();
