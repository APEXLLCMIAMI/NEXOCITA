(()=>{
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let config = null;
let receipt = null;
let slotRequest = 0;
let isOfflineMode = false;

const DEFAULT_SERVICES = [
  { id: '1', name: 'Perfilado de barba y toalla caliente', duration: 20 },
  { id: '2', name: 'Corte clásico de cabello', duration: 30 },
  { id: '3', name: 'Servicio integral de estilismo', duration: 50 },
  { id: '4', name: 'Consulta y diagnóstico profesional', duration: 45 }
];

const format = date => {
  try {
    return new Intl.DateTimeFormat('es-NI', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
  } catch {
    return date;
  }
};

async function api(path, body) {
  const r = await fetch('/api/' + path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  let data;
  try {
    data = await r.json();
  } catch {
    throw Error('offline');
  }
  if (!r.ok) throw Error(data.error || 'No se pudo completar la solicitud.');
  return data;
}

function getStoredAppointments() {
  try {
    return JSON.parse(localStorage.getItem('nexocita_appointments') || '[]');
  } catch {
    return [];
  }
}

function saveStoredAppointment(appointment, token) {
  const list = getStoredAppointments();
  list.push({ appointment, token });
  try {
    localStorage.setItem('nexocita_appointments', JSON.stringify(list));
  } catch {}
}

function updateStoredAppointment(id, token, newStatus) {
  const list = getStoredAppointments();
  const item = list.find(x => x.appointment && x.appointment.id === id && x.token === token);
  if (item) {
    item.appointment.status = newStatus;
    try {
      localStorage.setItem('nexocita_appointments', JSON.stringify(list));
    } catch {}
    return item.appointment;
  }
  return null;
}

function generateSlots(date) {
  const allTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];
  const apps = getStoredAppointments().filter(x => x.appointment && x.appointment.date === date && x.appointment.status === 'confirmed');
  const booked = new Set(apps.map(x => x.appointment.time));
  const available = allTimes.filter(t => !booked.has(t));
  return available.length ? available : allTimes.slice(0, 6);
}

function renderSlotButtons(times, date) {
  $('#slots').replaceChildren();
  if (!times.length) {
    $('#slots').innerHTML = '<p>No hay horarios disponibles para esta fecha. Prueba otro día.</p>';
    return;
  }
  times.forEach(time => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot';
    b.textContent = time;
    b.setAttribute('aria-pressed', 'false');
    b.onclick = () => {
      $$('#slots button').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      $('#selected-time').value = time;
      $('#confirm-booking').disabled = false;
      const serviceName = $('#service').selectedOptions[0]?.textContent || 'Servicio seleccionado';
      $('#booking-summary').textContent = `${serviceName} · ${format(date)} · ${time}`;
    };
    $('#slots').append(b);
  });
}

async function slots() {
  const request = ++slotRequest;
  $('#selected-time').value = '';
  $('#confirm-booking').disabled = true;
  $('#booking-summary').textContent = 'Selecciona un horario para continuar.';
  const date = $('#date').value;
  const service = $('#service').value;
  if (!date || !service) {
    $('#slots').innerHTML = '<p>Elige un servicio y una fecha.</p>';
    return;
  }
  
  if (isOfflineMode) {
    renderSlotButtons(generateSlots(date), date);
    return;
  }
  
  $('#slots').textContent = 'Consultando disponibilidad…';
  try {
    const data = await api(`availability?date=${encodeURIComponent(date)}&service=${encodeURIComponent(service)}`);
    if (request !== slotRequest) return;
    renderSlotButtons(data.slots || [], date);
  } catch (e) {
    if (request !== slotRequest) return;
    isOfflineMode = true;
    renderSlotButtons(generateSlots(date), date);
  }
}

$('#service').onchange = slots;
$('#date').onchange = slots;

$('#booking-form').onsubmit = async e => {
  e.preventDefault();
  $('#booking-error').textContent = '';
  const values = Object.fromEntries(new FormData(e.target));
  if (!values.time) {
    $('#booking-error').textContent = 'Selecciona un horario.';
    return;
  }
  $('#confirm-booking').disabled = true;

  if (isOfflineMode) {
    const id = 'NC-' + Math.floor(100000 + Math.random() * 900000);
    const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const serviceName = $('#service').selectedOptions[0]?.textContent || 'Servicio';
    const app = {
      id,
      service_id: values.service,
      service_name: serviceName,
      duration: 30,
      date: values.date,
      time: values.time,
      name: values.name,
      phone: values.phone,
      email: values.email || '',
      notes: values.notes || '',
      status: 'confirmed'
    };
    saveStoredAppointment(app, token);
    receipt = { appointment: app, token };
    showSuccess(app, token);
    return;
  }

  try {
    receipt = await api('book', values);
    showSuccess(receipt.appointment, receipt.token);
  } catch (error) {
    if (error.message === 'offline') {
      isOfflineMode = true;
      const id = 'NC-' + Math.floor(100000 + Math.random() * 900000);
      const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const serviceName = $('#service').selectedOptions[0]?.textContent || 'Servicio';
      const app = {
        id,
        service_id: values.service,
        service_name: serviceName,
        duration: 30,
        date: values.date,
        time: values.time,
        name: values.name,
        phone: values.phone,
        email: values.email || '',
        notes: values.notes || '',
        status: 'confirmed'
      };
      saveStoredAppointment(app, token);
      receipt = { appointment: app, token };
      showSuccess(app, token);
    } else {
      $('#booking-error').textContent = error.message;
      $('#confirm-booking').disabled = false;
      await slots();
    }
  }
};

function showSuccess(a, token) {
  $('#booking-form').hidden = true;
  $('#booking-success').hidden = false;
  // Populate new receipt card fields
  const parts = (a.service_name || '').split(' · ');
  const svcName = parts[0] || a.service_name;
  const dur = a.duration || parts[1]?.replace(' min','') || '—';
  $('#rr-service-val').textContent = svcName;
  $('#rr-date-val').textContent = `${format(a.date)} · ${a.time} (hora de Nicaragua)`;
  $('#rr-name-val').textContent = a.name;
  $('#rr-duration-val').textContent = `${dur} minutos`;
  $('#rr-code').textContent = a.id;
  $('#rr-token').textContent = token;
  $('#booking-success').scrollIntoView({ block: 'center', behavior: 'smooth' });
}

$('#new-booking').onclick = () => {
  $('#booking-success').hidden = true;
  $('#booking-form').hidden = false;
  $('#booking-form').reset();
  $('#date').value = config.today;
  slots();
};

$('#download-receipt').onclick = () => {
  const a = receipt.appointment;
  const biz = config?.business || 'NEXOCITA';
  const parts = (a.service_name || '').split(' · ');
  const svcName = parts[0] || a.service_name;
  const dur = a.duration || parts[1]?.replace(' min','') || '—';
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Comprobante · ${a.id} · NEXOCITA</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{background:white;border-radius:20px;max-width:480px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.12);overflow:hidden}
  .card-header{background:linear-gradient(135deg,#0071e3 0%,#004ea8 100%);padding:32px 28px;color:white;display:flex;align-items:center;gap:18px}
  .check{width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;flex-shrink:0}
  .card-header h1{font-size:22px;font-weight:700;letter-spacing:-.4px}
  .card-header p{font-size:13px;opacity:.8;margin-top:3px}
  .card-body{padding:28px}
  .row{display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid #f0f0f5}
  .row:last-child{border-bottom:0}
  .icon{width:36px;height:36px;border-radius:10px;background:#f0f6ff;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
  .row-info{flex:1}
  .row-label{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:#888;margin-bottom:3px}
  .row-val{font-size:15px;font-weight:600;color:#1d1d1f;word-break:break-word}
  .codes{background:#f8fafd;border-radius:14px;padding:20px;margin-top:20px;border:1px solid #e8ecf3}
  .codes-title{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#666;margin-bottom:14px}
  .code-row{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:white;border-radius:10px;margin-bottom:8px;border:1px solid #e5e8ef}
  .code-label{font-size:12px;color:#888}
  .code-val{font-family:'Courier New',monospace;font-size:14px;font-weight:700;color:#0071e3;letter-spacing:.5px}
  .footer{text-align:center;padding:20px 28px 24px;font-size:12px;color:#aaa;border-top:1px solid #f0f0f5}
  .footer strong{color:#0071e3}
  @media print{body{background:white}}
</style>
</head>
<body>
<div class="card">
  <div class="card-header">
    <div class="check">✓</div>
    <div><h1>Cita confirmada</h1><p>${biz} · Tu tiempo, en orden</p></div>
  </div>
  <div class="card-body">
    <div class="row"><div class="icon">✂️</div><div class="row-info"><div class="row-label">Servicio</div><div class="row-val">${svcName}</div></div></div>
    <div class="row"><div class="icon">📅</div><div class="row-info"><div class="row-label">Fecha y hora</div><div class="row-val">${format(a.date)} · ${a.time} (hora de Nicaragua)</div></div></div>
    <div class="row"><div class="icon">👤</div><div class="row-info"><div class="row-label">Cliente</div><div class="row-val">${a.name}</div></div></div>
    <div class="row"><div class="icon">⏱️</div><div class="row-info"><div class="row-label">Duración estimada</div><div class="row-val">${dur} minutos</div></div></div>
    <div class="codes">
      <div class="codes-title">🔑 Datos para gestionar tu cita</div>
      <div class="code-row"><span class="code-label">Código de reserva</span><span class="code-val">${a.id}</span></div>
      <div class="code-row"><span class="code-label">Clave de consulta</span><span class="code-val">${receipt.token}</span></div>
    </div>
  </div>
  <div class="footer">Generado por <strong>NEXOCITA</strong> · ${new Date().toLocaleDateString('es-NI')} · Presenta este comprobante al llegar</div>
</div>
</body>
</html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const aLink = document.createElement('a');
  aLink.href = url;
  aLink.download = `comprobante-nexocita-${a.id}.html`;
  aLink.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const statusNames = { confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada' };

async function lookup(cancel = false) {
  $('#lookup-error').textContent = '';
  const payload = Object.fromEntries(new FormData($('#lookup-form')));
  if (cancel) payload.cancel = true;

  if (isOfflineMode) {
    if (cancel) {
      const updated = updateStoredAppointment(payload.id, payload.token, 'cancelled');
      if (updated) {
        renderLookupCard(updated);
        slots();
      } else {
        $('#lookup-error').textContent = 'No se encontró la cita con los datos proporcionados.';
      }
      return;
    }
    const found = getStoredAppointments().find(x => x.appointment && x.appointment.id === payload.id && x.token === payload.token);
    if (found) {
      renderLookupCard(found.appointment);
    } else {
      $('#lookup-result').replaceChildren();
      $('#lookup-error').textContent = 'No se encontró una cita con ese código y clave.';
    }
    return;
  }

  try {
    const a = await api('my-appointment', payload);
    renderLookupCard(a);
  } catch (e) {
    if (e.message === 'offline') {
      isOfflineMode = true;
      lookup(cancel);
      return;
    }
    $('#lookup-result').replaceChildren();
    $('#lookup-error').textContent = e.message;
  }
}

function renderLookupCard(a) {
  const card = document.createElement('div');
  card.className = 'lookup-card';
  const p = document.createElement('p');
  p.textContent = `${a.service_name} · ${format(a.date)} · ${a.time} · ${statusNames[a.status] || a.status}`;
  card.append(p);
  if (a.status === 'confirmed') {
    const b = document.createElement('button');
    b.className = 'secondary-button danger-button';
    b.textContent = 'Cancelar esta cita';
    b.onclick = () => {
      if (confirm('¿Quieres cancelar esta cita y liberar el horario?')) lookup(true);
    };
    card.append(b);
  }
  $('#lookup-result').replaceChildren(card);
}

$('#lookup-form').onsubmit = e => {
  e.preventDefault();
  lookup();
};

function setupFallback() {
  isOfflineMode = true;
  const todayStr = new Date().toISOString().split('T')[0];
  config = { business: 'NEXOCITA', today: todayStr, setup_required: false };
  $('#date').min = todayStr;
  $('#date').value = todayStr;
  $('#service').replaceChildren();
  DEFAULT_SERVICES.forEach(s => {
    $('#service').append(new Option(`${s.name} · ${s.duration} min`, s.id));
  });
  slots();
}

api('config').then(data => {
  config = data;
  $('#business-name').textContent = `${data.business} · Reserva en pocos pasos.`;
  $('#date').min = data.today;
  $('#date').max = data.max_date;
  $('#date').value = data.today;
  $('#service').replaceChildren();
  data.services.forEach(s => $('#service').append(new Option(`${s.name} · ${s.duration} min`, s.id)));
  if (!data.services.length) {
    setupFallback();
  } else {
    slots();
  }
}).catch(() => {
  setupFallback();
});
})();
