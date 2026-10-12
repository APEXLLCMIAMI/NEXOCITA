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
  const r = await fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/api/' + path, {
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
  
  if (window.CloudDB && window.CloudDB.isReady()) {
    $('#slots').textContent = 'Consultando disponibilidad en la nube…';
    try {
      const booked = await window.CloudDB.getAppointmentsByDate(date);
      if (request !== slotRequest) return;
      const allTimes = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
      ];
      const bookedSet = new Set((booked || []).map(x => x.time));
      const avail = allTimes.filter(t => !bookedSet.has(t));
      renderSlotButtons(avail, date);
      return;
    } catch (e) {
      console.warn('Error al consultar horarios en CloudDB:', e);
    }
  }

  if (!isOfflineMode) {
    $('#slots').textContent = 'Consultando disponibilidad…';
    try {
      const data = await api(`availability?date=${encodeURIComponent(date)}&service=${encodeURIComponent(service)}`);
      if (request !== slotRequest) return;
      renderSlotButtons(data.slots || [], date);
      return;
    } catch (e) {
      if (request !== slotRequest) return;
      isOfflineMode = true;
    }
  }

  renderSlotButtons(generateSlots(date), date);
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

  const id = 'NC-' + Math.floor(100000 + Math.random() * 900000);
  const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  const serviceName = $('#service').selectedOptions[0]?.textContent || 'Servicio';
  const duration = config?.services?.find(s => String(s.id) === String(values.service))?.duration || 30;

  const app = {
    id,
    service_id: values.service,
    service_name: serviceName,
    duration,
    date: values.date,
    time: values.time,
    name: (values.name || '').trim(),
    phone: (values.phone || '').trim(),
    email: (values.email || '').trim(),
    notes: (values.notes || '').trim(),
    status: 'confirmed',
    created_at: new Date().toISOString()
  };

  // 1. Guardar en Firebase Cloud si está disponible (unifica todos los teléfonos y PCs)
  if (window.CloudDB && window.CloudDB.isReady()) {
    try {
      await window.CloudDB.saveAppointment(app, token);
      saveStoredAppointment(app, token);
      receipt = { appointment: app, token };
      showSuccess(app, token);
      return;
    } catch (cloudErr) {
      console.error('Error guardando en CloudDB:', cloudErr);
    }
  }

  // 2. Intentar API de servidor local si está corriendo
  if (!isOfflineMode) {
    try {
      receipt = await api('book', values);
      saveStoredAppointment(receipt.appointment, receipt.token);
      showSuccess(receipt.appointment, receipt.token);
      return;
    } catch (error) {
      if (error.message !== 'offline') {
        $('#booking-error').textContent = error.message;
        $('#confirm-booking').disabled = false;
        await slots();
        return;
      }
      isOfflineMode = true;
    }
  }

  // 3. Fallback de contingencia local
  saveStoredAppointment(app, token);
  receipt = { appointment: app, token };
  showSuccess(app, token);
};

function showSuccess(a, token) {
  $('#booking-form').hidden = true;
  $('#booking-success').hidden = false;
  const parts = (a.service_name || '').split(' · ');
  const svcName = parts[0] || a.service_name;
  const dur = a.duration || parts[1]?.replace(' min','') || '—';
  $('#rr-service-val').textContent = svcName;
  $('#rr-date-val').textContent = `${format(a.date)} · ${a.time} (hora de Nicaragua)`;
  $('#rr-name-val').textContent = a.name;
  const phoneEl = $('#rr-phone-val');
  if (phoneEl) phoneEl.textContent = a.phone || '—';
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

function buildReceiptHtml(a, token) {
  const biz = config?.business || 'NEXOCITA';
  const parts = (a.service_name || '').split(' · ');
  const svcName = parts[0] || a.service_name;
  const dur = a.duration || parts[1]?.replace(' min','') || '—';
  const issueDate = new Intl.DateTimeFormat('es-NI', { dateStyle: 'full', timeStyle: 'short' }).format(new Date());

  // Generador de código de barras SVG
  let barcodeBars = '';
  let bx = 16;
  const barcodeStr = (a.id || 'NEXOCITA').replace(/[^a-zA-Z0-9]/g, '');
  for (let i = 0; i < barcodeStr.length; i++) {
    const c = barcodeStr.charCodeAt(i);
    const pat = [((c * 3) % 3) + 1, ((c * 7) % 3) + 1, ((c * 5) % 2) + 1, ((c * 11) % 3) + 1];
    pat.forEach((w, idx) => {
      if (idx % 2 === 0) {
        barcodeBars += `<rect x="${bx}" y="0" width="${w * 1.8}" height="42" fill="#0f172a"/>`;
      }
      bx += w * 1.8 + 2;
    });
    bx += 2;
  }
  const barcodeSvg = `<svg viewBox="0 0 ${Math.max(bx + 16, 260)} 42" preserveAspectRatio="none" style="width:100%;max-width:270px;height:38px;display:block;margin:0 auto">${barcodeBars}</svg>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Comprobante Oficial · ${a.id} · NEXOCITA</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    background:#eef2f7;
    font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    color:#1e293b;
    min-height:100vh;
    padding:24px 16px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
  }
  .toolbar{
    max-width:540px;
    width:100%;
    margin-bottom:16px;
    display:flex;
    gap:10px;
    justify-content:space-between;
    align-items:center;
  }
  .toolbar-btn{
    display:inline-flex;
    align-items:center;
    gap:8px;
    padding:10px 18px;
    border-radius:12px;
    font-size:13px;
    font-weight:600;
    text-decoration:none;
    border:0;
    cursor:pointer;
    transition:transform .15s,opacity .15s;
  }
  .btn-print{
    background:linear-gradient(135deg,#0071e3 0%,#0052cc 100%);
    color:white;
    box-shadow:0 4px 14px rgba(0,113,227,.3);
  }
  .btn-home{
    background:white;
    color:#334155;
    border:1px solid #cbd5e1;
  }
  .toolbar-btn:hover{opacity:.9;transform:translateY(-1px)}
  .ticket-wrapper{
    max-width:540px;
    width:100%;
    background:white;
    border-radius:24px;
    overflow:hidden;
    box-shadow:0 25px 70px rgba(15,23,42,.12),0 4px 16px rgba(15,23,42,.06);
    border:1px solid #e2e8f0;
    position:relative;
  }
  .ticket-header{
    background:linear-gradient(135deg,#071e3d 0%,#0b3266 50%,#0052cc 100%);
    color:white;
    padding:32px 28px 24px;
    position:relative;
    border-bottom:3px solid #38bdf8;
  }
  .header-top{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:14px;
  }
  .brand-badge{
    display:flex;
    align-items:center;
    gap:8px;
  }
  .brand-icon{
    width:32px;
    height:32px;
    border-radius:8px;
    background:#38bdf8;
    color:#071e3d;
    font-weight:900;
    font-size:18px;
    display:grid;
    place-items:center;
  }
  .brand-name{
    font-size:15px;
    font-weight:800;
    letter-spacing:1.5px;
  }
  .status-pill{
    background:rgba(56,189,248,.18);
    border:1px solid rgba(56,189,248,.4);
    color:#7dd3fc;
    font-size:11px;
    font-weight:700;
    letter-spacing:.8px;
    padding:4px 12px;
    border-radius:20px;
    text-transform:uppercase;
  }
  .header-main h1{
    font-size:24px;
    font-weight:700;
    letter-spacing:-.5px;
    margin-bottom:4px;
  }
  .header-main p{
    font-size:13px;
    color:#bae6fd;
    font-weight:400;
  }
  .ticket-code-banner{
    background:#f8fafc;
    border-bottom:1px solid #e2e8f0;
    padding:20px 28px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:16px;
  }
  .code-block{
    display:flex;
    flex-direction:column;
  }
  .code-label{
    font-size:11px;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:.8px;
    color:#64748b;
    margin-bottom:4px;
  }
  .code-val{
    font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
    font-size:22px;
    font-weight:800;
    color:#0052cc;
    letter-spacing:1px;
  }
  .qr-badge{
    background:white;
    border:1px dashed #cbd5e1;
    border-radius:12px;
    padding:8px 12px;
    text-align:center;
    font-size:11px;
    color:#475569;
    font-weight:600;
  }
  .ticket-body{
    padding:26px 28px;
  }
  .detail-grid{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:18px 20px;
    margin-bottom:24px;
  }
  .detail-cell{
    display:flex;
    flex-direction:column;
  }
  .detail-cell.full-width{
    grid-column:1/-1;
  }
  .cell-label{
    font-size:11px;
    font-weight:600;
    text-transform:uppercase;
    letter-spacing:.6px;
    color:#94a3b8;
    margin-bottom:4px;
    display:flex;
    align-items:center;
    gap:6px;
  }
  .cell-value{
    font-size:15px;
    font-weight:600;
    color:#0f172a;
    line-height:1.35;
  }
  .cell-value.highlight{
    color:#0052cc;
    font-size:16px;
  }
  .ticket-divider{
    position:relative;
    margin:10px 0 24px;
    display:flex;
    align-items:center;
    justify-content:center;
  }
  .divider-line{
    width:100%;
    border-top:2px dashed #e2e8f0;
  }
  .notch-left,.notch-right{
    position:absolute;
    width:22px;
    height:22px;
    background:#eef2f7;
    border-radius:50%;
    top:calc(50% - 11px);
  }
  .notch-left{left:-39px}
  .notch-right{right:-39px}
  .security-box{
    background:#f0fdf4;
    border:1px solid #bbf7d0;
    border-radius:14px;
    padding:16px;
    margin-bottom:24px;
  }
  .security-title{
    font-size:12px;
    font-weight:700;
    color:#15803d;
    text-transform:uppercase;
    letter-spacing:.5px;
    margin-bottom:6px;
    display:flex;
    align-items:center;
    gap:6px;
  }
  .security-token{
    font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
    font-size:14px;
    font-weight:700;
    color:#166534;
    background:white;
    padding:6px 12px;
    border-radius:8px;
    border:1px solid #dcfce7;
    display:inline-block;
    margin:4px 0 6px;
    letter-spacing:.5px;
  }
  .security-desc{
    font-size:12px;
    color:#166534;
    line-height:1.4;
  }
  .barcode-section{
    text-align:center;
    padding:8px 0;
  }
  .barcode-section p{
    font-size:11px;
    color:#94a3b8;
    margin-top:6px;
    letter-spacing:.5px;
  }
  .ticket-footer{
    background:#f8fafc;
    border-top:1px solid #e2e8f0;
    padding:18px 28px;
    text-align:center;
    font-size:11.5px;
    color:#64748b;
    line-height:1.5;
  }
  .ticket-footer strong{color:#0f172a}
  @media print{
    body{background:white;padding:0}
    .toolbar{display:none}
    .ticket-wrapper{box-shadow:none;border:1px solid #cbd5e1;max-width:100%}
    .notch-left,.notch-right{background:white}
    @page{margin:10mm;size:auto}
  }
  @media(max-width:500px){
    .detail-grid{grid-template-columns:1fr}
    .ticket-code-banner{flex-direction:column;align-items:flex-start}
    .header-main h1{font-size:21px}
  }
</style>
</head>
<body>

<div class="toolbar">
  <button class="toolbar-btn btn-print" onclick="window.print()">🖨️ Imprimir / Guardar en PDF</button>
  <a class="toolbar-btn btn-home" href="https://apexllcmiami.github.io">🌐 Volver a NEXOCITA</a>
</div>

<div class="ticket-wrapper">
  <div class="ticket-header">
    <div class="header-top">
      <div class="brand-badge">
        <div class="brand-icon">N</div>
        <span class="brand-name">NEXOCITA</span>
      </div>
      <div class="status-pill">✓ CONFIRMADA</div>
    </div>
    <div class="header-main">
      <h1>Comprobante de Reserva</h1>
      <p>${biz} · Tu tiempo, en orden.</p>
    </div>
  </div>

  <div class="ticket-code-banner">
    <div class="code-block">
      <span class="code-label">Código Oficial de Reserva</span>
      <span class="code-val">${a.id}</span>
    </div>
    <div class="qr-badge">
      <span>DIGITAL PASS</span><br>
      <small style="color:#0052cc">#${a.id}</small>
    </div>
  </div>

  <div class="ticket-body">
    <div class="detail-grid">
      <div class="detail-cell full-width">
        <span class="cell-label">✂️ Servicio Reservado</span>
        <span class="cell-value highlight">${svcName}</span>
      </div>
      <div class="detail-cell full-width">
        <span class="cell-label">📅 Fecha y Hora de la Cita</span>
        <span class="cell-value">${format(a.date)} a las ${a.time} (Hora de Nicaragua)</span>
      </div>
      <div class="detail-cell">
        <span class="cell-label">👤 Cliente</span>
        <span class="cell-value">${a.name}</span>
      </div>
      <div class="detail-cell">
        <span class="cell-label">📞 Teléfono de Contacto</span>
        <span class="cell-value">${a.phone || '—'}</span>
      </div>
      <div class="detail-cell">
        <span class="cell-label">⏱️ Duración Estimada</span>
        <span class="cell-value">${dur} minutos</span>
      </div>
      <div class="detail-cell">
        <span class="cell-label">🏢 Establecimiento</span>
        <span class="cell-value">${biz}</span>
      </div>
    </div>

    <div class="ticket-divider">
      <div class="notch-left"></div>
      <div class="divider-line"></div>
      <div class="notch-right"></div>
    </div>

    <div class="security-box">
      <div class="security-title">🔑 Clave Privada de Consulta y Cancelación</div>
      <div class="security-token">${token}</div>
      <p class="security-desc">Guarda esta clave de forma privada. Con ella puedes verificar el estado de tu cita o cancelarla en caso de cualquier eventualidad desde «¿Ya tienes una cita?» en el sitio web oficial.</p>
    </div>

    <div class="barcode-section">
      ${barcodeSvg}
      <p>Presenta este comprobante o tu código ${a.id} al momento de tu llegada</p>
    </div>
  </div>

  <div class="ticket-footer">
    Emitido el ${issueDate} · Sistema Oficial de Citas <strong>NEXOCITA</strong><br>
    <a href="https://apexllcmiami.github.io" style="color:#0052cc;text-decoration:none;font-weight:600">https://apexllcmiami.github.io</a>
  </div>
</div>

</body>
</html>`;
}

$('#download-receipt').onclick = () => {
  const a = receipt.appointment;
  const token = receipt.token;
  const html = buildReceiptHtml(a, token);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const aLink = document.createElement('a');
  aLink.href = url;
  aLink.download = `comprobante-nexocita-${a.id}.html`;
  document.body.appendChild(aLink);
  aLink.click();
  document.body.removeChild(aLink);
  setTimeout(() => URL.revokeObjectURL(url), 2500);
};

const printBtn = $('#print-receipt');
if (printBtn) {
  printBtn.onclick = () => {
    const a = receipt.appointment;
    const token = receipt.token;
    const html = buildReceiptHtml(a, token);
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      setTimeout(() => {
        printWin.focus();
        printWin.print();
      }, 350);
    } else {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(html);
      iframe.contentWindow.document.close();
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 500);
    }
  };
}

const statusNames = { confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada' };

async function lookup(cancel = false) {
  $('#lookup-error').textContent = '';
  const payload = Object.fromEntries(new FormData($('#lookup-form')));
  if (cancel) payload.cancel = true;

  // 1. CloudDB si está activo
  if (window.CloudDB && window.CloudDB.isReady()) {
    try {
      if (cancel) {
        await window.CloudDB.updateAppointment(payload.id, { status: 'cancelled' });
        updateStoredAppointment(payload.id, payload.token, 'cancelled');
        const updated = await window.CloudDB.lookupAppointment(payload.id, payload.token);
        if (updated) renderLookupCard(updated);
        slots();
        return;
      }
      const found = await window.CloudDB.lookupAppointment(payload.id, payload.token);
      if (found) {
        renderLookupCard(found);
      } else {
        $('#lookup-result').replaceChildren();
        $('#lookup-error').textContent = 'No se encontró una cita con ese código y clave.';
      }
      return;
    } catch (e) {
      $('#lookup-result').replaceChildren();
      $('#lookup-error').textContent = e.message || 'Error al consultar la cita.';
      return;
    }
  }

  // 2. Modo offline local
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

  // 3. API backend servidor local
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

async function startApp() {
  // Primero: si CloudDB está listo, cargar configuración de la nube
  if (window.CloudDB && window.CloudDB.isReady()) {
    try {
      const [cloudSvcs, cloudSettings] = await Promise.all([
        window.CloudDB.getServices(),
        window.CloudDB.getSettings()
      ]);
      const todayStr = new Date().toISOString().split('T')[0];
      const maxDate = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
      const biz = cloudSettings?.business || 'NEXOCITA';
      const svcs = (cloudSvcs && cloudSvcs.length)
        ? cloudSvcs.filter(s => s.active !== 0 && s.active !== false)
        : DEFAULT_SERVICES;
      config = { business: biz, today: todayStr, max_date: maxDate, services: svcs };
      $('#business-name').textContent = `${biz} · Reserva en pocos pasos.`;
      $('#date').min = todayStr;
      $('#date').max = maxDate;
      $('#date').value = todayStr;
      $('#service').replaceChildren();
      svcs.forEach(s => $('#service').append(new Option(`${s.name} · ${s.duration} min`, s.id)));
      slots();
      return;
    } catch (e) {
      console.warn('Error iniciando con CloudDB:', e);
    }
  }

  // Segundo: intentar API del servidor local
  try {
    const data = await api('config');
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
  } catch {
    setupFallback();
  }
}

startApp();
})();
