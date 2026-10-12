(() => {
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let config, data, selectedDate, month, editAction, toastTimer;
let isOffline = false;

const states = { confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada' };

const DEFAULT_HOURS = [
  { open: '09:00', close: '17:00', closed: false },
  { open: '09:00', close: '17:00', closed: false },
  { open: '09:00', close: '17:00', closed: false },
  { open: '09:00', close: '17:00', closed: false },
  { open: '09:00', close: '17:00', closed: false },
  { open: '09:00', close: '17:00', closed: false },
  { open: '09:00', close: '17:00', closed: true }
];

const DEFAULT_SERVICES = [
  { id: 1, name: 'Perfilado de barba y toalla caliente', duration: 20, active: 1 },
  { id: 2, name: 'Corte clásico de cabello', duration: 30, active: 1 },
  { id: 3, name: 'Servicio integral de estilismo', duration: 50, active: 1 },
  { id: 4, name: 'Consulta y diagnóstico profesional', duration: 45, active: 1 }
];

function element(tag, text, className) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
}

function button(text, action, extra = '') {
  const b = element('button', text, ('secondary-button ' + extra).trim());
  b.type = 'button';
  b.onclick = action;
  return b;
}

async function api(path, body, method = 'POST') {
  let r, d;
  try {
    r = await fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/api/' + path, {
      method: body ? method : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw Error('offline');
  }
  const text = await r.text();
  try {
    d = JSON.parse(text);
  } catch {
    throw Error('offline');
  }
  if (!r.ok) {
    if (r.status === 401 && !path.includes('login')) {
      location.reload();
    }
    throw Error(d.error || 'No se pudo completar la solicitud.');
  }
  return d;
}

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').hidden = true, 4000);
}

async function action(callback) {
  $('#global-error').textContent = '';
  try {
    await callback();
  } catch (e) {
    if (e.message !== 'offline') {
      $('#global-error').textContent = e.message;
      $('#global-error').scrollIntoView({ block: 'center' });
    }
  }
}

// ── Almacenamiento local (fallback offline) ──────────────────────────────────

function getLocalAppointmentsList() {
  let raw = [];
  try { raw = JSON.parse(localStorage.getItem('nexocita_appointments') || '[]'); } catch {}
  if (!raw.length) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const seed = [
      { appointment: { id: 'NC-582104', name: 'Oliver Corrales', phone: '88992211', email: 'oliver@ejemplo.com', service_name: 'Perfilado de barba y toalla caliente', duration: 20, date: today, time: '10:00', notes: 'Cliente frecuente', status: 'confirmed' }, token: 'seed1' },
      { appointment: { id: 'NC-914372', name: 'María Rodríguez', phone: '77665544', email: 'maria@ejemplo.com', service_name: 'Corte clásico de cabello', duration: 30, date: today, time: '14:30', notes: '', status: 'confirmed' }, token: 'seed2' },
      { appointment: { id: 'NC-349811', name: 'Carlos Mendoza', phone: '82345678', email: 'carlos@ejemplo.com', service_name: 'Servicio integral de estilismo', duration: 50, date: tomorrow, time: '11:00', notes: 'Primera visita', status: 'confirmed' }, token: 'seed3' }
    ];
    try { localStorage.setItem('nexocita_appointments', JSON.stringify(seed)); } catch {}
    raw = seed;
  }
  return raw.map(x => x.appointment).filter(Boolean);
}

function buildLocalClients(appointments) {
  const map = new Map();
  appointments.forEach(a => {
    const key = a.phone || a.name;
    if (!map.has(key)) map.set(key, { id: map.size + 1, name: a.name, phone: a.phone, email: a.email || '', visits: 0 });
    const c = map.get(key);
    c.visits++;
    if (a.email && !c.email) c.email = a.email;
  });
  return Array.from(map.values());
}

function getLocalServices() {
  try { const s = localStorage.getItem('nexocita_admin_services'); if (s) return JSON.parse(s); } catch {}
  return DEFAULT_SERVICES;
}
function saveLocalServices(services) { try { localStorage.setItem('nexocita_admin_services', JSON.stringify(services)); } catch {} }

function getLocalHours() {
  try { const h = localStorage.getItem('nexocita_admin_hours'); if (h) return JSON.parse(h); } catch {}
  return DEFAULT_HOURS;
}
function saveLocalHours(hours) { try { localStorage.setItem('nexocita_admin_hours', JSON.stringify(hours)); } catch {} }

function getLocalBusiness() { return localStorage.getItem('nexocita_admin_business') || 'NEXOCITA'; }
function saveLocalBusiness(name) { try { localStorage.setItem('nexocita_admin_business', name); } catch {} }

// ── Carga de datos (CloudDB Firebase > Servidor SQLite > LocalStorage) ────────

function updateCloudBadges() {
  const isCloud = window.CloudDB && window.CloudDB.isReady();
  const badge = $('#cloud-status-badge');
  const detailBadge = $('#cloud-detail-badge');
  if (badge) {
    badge.textContent = isCloud ? '🟢 Nube Activa' : '🟡 Modo Local';
    badge.title = isCloud ? 'Sincronizado en tiempo real con Firebase' : 'Sin conexión a la nube. Haz clic para conectar Firebase.';
    badge.style.background = isCloud ? '#e6f4ea' : '#fef7e0';
    badge.style.color = isCloud ? '#137333' : '#b06000';
  }
  if (detailBadge) {
    detailBadge.textContent = isCloud ? '🟢 Conectado a Firebase' : '🟡 Sin conectar';
    detailBadge.style.background = isCloud ? '#e6f4ea' : '#fef7e0';
    detailBadge.style.color = isCloud ? '#137333' : '#b06000';
  }
}

async function load() {
  updateCloudBadges();

  // 1. Prioridad: CloudDB Firebase (sincroniza todos los dispositivos en tiempo real)
  if (window.CloudDB && window.CloudDB.isReady()) {
    try {
      const [cloudApps, cloudSvcs, cloudSettings] = await Promise.all([
        window.CloudDB.getAppointments(),
        window.CloudDB.getServices(),
        window.CloudDB.getSettings()
      ]);

      const apps = (cloudApps && cloudApps.length)
        ? cloudApps.map(x => x.appointment).filter(Boolean)
        : getLocalAppointmentsList();

      data = {
        business: cloudSettings?.business || getLocalBusiness(),
        appointments: apps,
        clients: buildLocalClients(apps),
        services: (cloudSvcs && cloudSvcs.length) ? cloudSvcs : getLocalServices(),
        hours: cloudSettings?.hours || getLocalHours()
      };

      // Escuchar cambios en vivo desde cualquier teléfono o PC
      window.CloudDB.onAppointmentsChange(newRaw => {
        if (!newRaw) return;
        const liveApps = newRaw.map(x => x.appointment).filter(Boolean);
        data.appointments = liveApps;
        data.clients = buildLocalClients(liveApps);
        renderMetrics();
        renderCalendar();
        renderAppointments();
        renderClients();
      });

    } catch (err) {
      console.warn('Error cargando desde CloudDB, usando respaldo:', err);
    }
  }

  // 2. Si no hay CloudDB o no devolvió datos, intentar servidor API o local
  if (!data || !data.appointments) {
    if (isOffline) {
      const appointments = getLocalAppointmentsList();
      data = {
        business: getLocalBusiness(),
        appointments,
        clients: buildLocalClients(appointments),
        services: getLocalServices(),
        hours: getLocalHours()
      };
    } else {
      try {
        data = await api('admin/data');
      } catch (e) {
        isOffline = true;
        return load();
      }
    }
  }

  $('#panel-business').textContent = data.business;
  $('#auth').hidden = true;
  $('#dashboard').hidden = false;
  $('#logout').hidden = false;
  renderMetrics();
  renderCalendar();
  renderAppointments();
  renderClients();
  renderServices();
  renderSettings();
  renderCloudTab();
}

// ── Formato de fecha ─────────────────────────────────────────────────────────

function format(date) {
  try {
    return new Intl.DateTimeFormat('es-NI', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
  } catch { return date; }
}

// ── Métricas ─────────────────────────────────────────────────────────────────

function renderMetrics() {
  const all = data.appointments;
  const metrics = [
    ['Citas para hoy', all.filter(a => a.date === config.today && a.status !== 'cancelled').length],
    ['Próximas citas', all.filter(a => a.date >= config.today && a.status === 'confirmed').length],
    ['Clientes', data.clients.length],
    ['Completadas', all.filter(a => a.status === 'completed').length]
  ];
  $('#metrics').replaceChildren(...metrics.map(([label, value]) => {
    const card = element('div', undefined, 'metric');
    card.append(element('span', label), element('strong', value));
    return card;
  }));
}

// ── Calendario ───────────────────────────────────────────────────────────────

function renderCalendar() {
  const [year, m] = month.split('-').map(Number);
  const days = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7;
  $('#calendar-month').textContent = new Intl.DateTimeFormat('es-NI', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T12:00:00Z`));
  $('#calendar').replaceChildren(...['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => element('span', d)));
  for (let i = 0; i < offset; i++) $('#calendar').append(element('span', ''));
  for (let d = 1; d <= days; d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`;
    const b = element('button', d, 'calendar-day');
    b.setAttribute('aria-label', format(date));
    b.setAttribute('aria-pressed', String(date === selectedDate));
    if (date === selectedDate) b.classList.add('selected');
    if (date === config.today) b.classList.add('today');
    if (data.appointments.some(a => a.date === date && a.status !== 'cancelled')) b.classList.add('has-bookings');
    b.onclick = () => { selectedDate = date; $('#all-dates').checked = false; renderCalendar(); renderAppointments(); };
    $('#calendar').append(b);
  }
}

function moveMonth(delta) {
  const d = new Date(`${month}-01T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  month = d.toISOString().slice(0, 7);
  renderCalendar();
}

$('#prev-month').onclick = () => moveMonth(-1);
$('#next-month').onclick = () => moveMonth(1);
$('#today-button').onclick = () => {
  selectedDate = config.today;
  month = config.today.slice(0, 7);
  $('#all-dates').checked = false;
  renderCalendar();
  renderAppointments();
};

// ── Citas ────────────────────────────────────────────────────────────────────

function renderAppointments() {
  const query = $('#search-appointments').value.toLocaleLowerCase(),
    status = $('#status-filter').value,
    all = $('#all-dates').checked;
  $('#agenda-title').textContent = all ? 'Todas las citas' : format(selectedDate);
  const appointments = data.appointments.filter(a =>
    (all || a.date === selectedDate) &&
    (!status || a.status === status) &&
    `${a.name} ${a.phone}`.toLocaleLowerCase().includes(query)
  );
  $('#appointments').replaceChildren();
  if (!appointments.length) {
    $('#appointments').append(element('p', 'No hay citas que coincidan con esta selección.', 'empty-state'));
    return;
  }
  appointments.forEach(a => {
    const row = element('article', undefined, 'appointment-row'),
      head = element('div', undefined, 'appointment-heading'),
      title = element('div');
    title.append(element('h3', `${a.time} · ${a.name}`), element('p', a.service_name));
    head.append(title, element('span', states[a.status], 'status ' + a.status));
    row.append(head, element('p', `${format(a.date)} · ${a.duration} min · Tel. ${a.phone} · #${a.id}`, 'row-meta'));
    if (a.notes) row.append(element('p', a.notes, 'row-meta'));
    const actions = element('div', undefined, 'row-actions');
    if (a.status === 'confirmed') {
      actions.append(
        button('Reprogramar', () => editAppointment(a)),
        button('Marcar completada', () => action(async () => {
          if (window.CloudDB && window.CloudDB.isReady()) {
            await window.CloudDB.updateAppointment(a.id, { status: 'completed' });
            const raw = JSON.parse(localStorage.getItem('nexocita_appointments') || '[]');
            const item = raw.find(x => x.appointment && x.appointment.id === a.id);
            if (item) item.appointment.status = 'completed';
            localStorage.setItem('nexocita_appointments', JSON.stringify(raw));
            await load(); toast('Cita completada en la nube.'); return;
          }
          if (isOffline) {
            const raw = JSON.parse(localStorage.getItem('nexocita_appointments') || '[]');
            const item = raw.find(x => x.appointment && x.appointment.id === a.id);
            if (item) item.appointment.status = 'completed';
            localStorage.setItem('nexocita_appointments', JSON.stringify(raw));
            await load(); toast('Cita completada.'); return;
          }
          await api('admin/appointment', { id: a.id, status: 'completed' }, 'PATCH');
          await load(); toast('Cita completada.');
        })),
        button('Cancelar', () => {
          if (confirm(`¿Cancelar la cita de ${a.name}?`)) {
            action(async () => {
              if (window.CloudDB && window.CloudDB.isReady()) {
                await window.CloudDB.updateAppointment(a.id, { status: 'cancelled' });
                const raw = JSON.parse(localStorage.getItem('nexocita_appointments') || '[]');
                const item = raw.find(x => x.appointment && x.appointment.id === a.id);
                if (item) item.appointment.status = 'cancelled';
                localStorage.setItem('nexocita_appointments', JSON.stringify(raw));
                await load(); toast('Cita cancelada en la nube.'); return;
              }
              if (isOffline) {
                const raw = JSON.parse(localStorage.getItem('nexocita_appointments') || '[]');
                const item = raw.find(x => x.appointment && x.appointment.id === a.id);
                if (item) item.appointment.status = 'cancelled';
                localStorage.setItem('nexocita_appointments', JSON.stringify(raw));
                await load(); toast('Cita cancelada. El horario quedó libre.'); return;
              }
              await api('admin/appointment', { id: a.id, status: 'cancelled' }, 'PATCH');
              await load(); toast('Cita cancelada. El horario quedó libre.');
            });
          }
        }, 'danger-button')
      );
    }
    row.append(actions);
    $('#appointments').append(row);
  });
}

['search-appointments', 'status-filter', 'all-dates'].forEach(id => $('#' + id).addEventListener('input', renderAppointments));

// ── Editor de cita ────────────────────────────────────────────────────────────

function field(label, name, value, type = 'text', required = true) {
  const wrapper = element('label', label), input = document.createElement('input');
  input.name = name; input.type = type; input.value = value; input.required = required;
  wrapper.append(input); return wrapper;
}

function openEditor(title, fields, save) {
  $('#edit-title').textContent = title;
  $('#edit-fields').replaceChildren(...fields);
  $('#edit-error').textContent = '';
  editAction = save;
  $('#edit-dialog').showModal();
}

function editAppointment(a) {
  const date = field('Nueva fecha', 'date', a.date, 'date'),
    time = field('Nueva hora', 'time', a.time, 'time');
  date.querySelector('input').min = config.today;
  date.querySelector('input').max = config.max_date;
  time.querySelector('input').step = 900;
  openEditor('Reprogramar cita', [date, time, element('p', `${a.service_name} · ${a.duration} min.`)], async values => {
    if (window.CloudDB && window.CloudDB.isReady()) {
      await window.CloudDB.updateAppointment(a.id, { date: values.date, time: values.time });
      const raw = JSON.parse(localStorage.getItem('nexocita_appointments') || '[]');
      const item = raw.find(x => x.appointment && x.appointment.id === a.id);
      if (item) { item.appointment.date = values.date; item.appointment.time = values.time; }
      localStorage.setItem('nexocita_appointments', JSON.stringify(raw));
      return;
    }
    if (isOffline) {
      const raw = JSON.parse(localStorage.getItem('nexocita_appointments') || '[]');
      const item = raw.find(x => x.appointment && x.appointment.id === a.id);
      if (item) { item.appointment.date = values.date; item.appointment.time = values.time; }
      localStorage.setItem('nexocita_appointments', JSON.stringify(raw));
      return Promise.resolve();
    }
    return api('admin/appointment', { id: a.id, ...values }, 'PATCH');
  });
}

$('#close-edit').onclick = () => $('#edit-dialog').close();
$('#edit-form').onsubmit = async e => {
  e.preventDefault();
  const save = e.submitter;
  save.disabled = true;
  try {
    await editAction(Object.fromEntries(new FormData(e.target)));
    $('#edit-dialog').close();
    await load(); toast('Cambios guardados.');
  } catch (error) {
    $('#edit-error').textContent = error.message;
  } finally {
    save.disabled = false;
  }
};

// ── Clientes ─────────────────────────────────────────────────────────────────

function renderClients() {
  const query = $('#search-clients').value.toLowerCase();
  const clients = data.clients.filter(c => `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(query));
  $('#clients').replaceChildren();
  if (!clients.length) {
    $('#clients').append(element('p', 'Los clientes aparecerán aquí al reservar su primera cita.', 'empty-state'));
    return;
  }
  clients.forEach(c => {
    const card = element('article', undefined, 'client-card');
    card.append(
      element('h3', c.name),
      element('p', c.phone),
      element('p', c.email || 'Sin correo electrónico'),
      element('p', `${c.visits} cita(s) registradas`),
      button('Editar cliente', () => {
        const name = field('Nombre', 'name', c.name),
          email = field('Correo (opcional)', 'email', c.email, 'email', false);
        name.querySelector('input').minLength = 2;
        openEditor('Editar cliente', [name, email], async values => {
          if (window.CloudDB && window.CloudDB.isReady()) {
            const apps = data.appointments.filter(a => a.phone === c.phone);
            for (const app of apps) {
              await window.CloudDB.updateAppointment(app.id, {
                name: values.name || app.name,
                email: values.email !== undefined ? values.email : app.email
              });
            }
            return;
          }
          if (isOffline) {
            const raw = JSON.parse(localStorage.getItem('nexocita_appointments') || '[]');
            raw.forEach(x => {
              if (x.appointment && x.appointment.phone === c.phone) {
                if (values.name) x.appointment.name = values.name;
                if (values.email !== undefined) x.appointment.email = values.email;
              }
            });
            localStorage.setItem('nexocita_appointments', JSON.stringify(raw));
            return Promise.resolve();
          }
          return api('admin/client', { id: c.id, ...values }, 'PATCH');
        });
      }),
      button('Ver citas', () => {
        $('#search-appointments').value = c.phone;
        $('#all-dates').checked = true;
        $('#status-filter').value = '';
        selectView('agenda');
        renderAppointments();
      })
    );
    $('#clients').append(card);
  });
}

$('#search-clients').oninput = renderClients;

// ── Servicios ─────────────────────────────────────────────────────────────────

function renderServices() {
  $('#services').replaceChildren(...data.services.map(s => {
    const row = element('div', undefined, 'service-row'), p = element('p', s.name);
    p.append(element('span', `${s.duration} minutos · ${s.active ? 'Activo' : 'Inactivo'}`));
    row.append(p, button(s.active ? 'Desactivar' : 'Activar', () => action(async () => {
      const svcs = data.services;
      const found = svcs.find(x => x.id === s.id);
      if (found) found.active = found.active ? 0 : 1;
      if (window.CloudDB && window.CloudDB.isReady()) {
        await window.CloudDB.saveServices(svcs);
      }
      saveLocalServices(svcs);
      if (!isOffline) {
        try { await api('admin/service', { id: s.id, active: !s.active }, 'PATCH'); } catch {}
      }
      await load(); toast('Servicio actualizado.');
    })));
    return row;
  }));
}

$('#service-form').onsubmit = e => {
  e.preventDefault();
  const form = e.target;
  const values = Object.fromEntries(new FormData(form));
  action(async () => {
    const svcs = data.services || getLocalServices();
    const newSvc = { id: Date.now(), name: values.name, duration: Number(values.duration), active: 1 };
    svcs.push(newSvc);
    if (window.CloudDB && window.CloudDB.isReady()) {
      await window.CloudDB.saveServices(svcs);
    }
    saveLocalServices(svcs);
    if (!isOffline) {
      try { await api('admin/service', { ...values, duration: Number(values.duration) }); } catch {}
    }
    form.reset();
    await load(); toast('Servicio añadido.');
  });
};

// ── Horario ───────────────────────────────────────────────────────────────────

function renderSettings() {
  $('#settings-business').value = data.business;
  $('#hours').replaceChildren(...data.hours.map((h, i) => {
    const row = element('div', undefined, 'hours-row'),
      day = element('label', undefined, 'day-label'),
      check = document.createElement('input');
    check.type = 'checkbox'; check.checked = !h.closed; check.name = `open-${i}`;
    day.append(check, document.createTextNode(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][i]));
    row.append(day);
    ['open', 'close'].forEach(key => {
      const input = document.createElement('input');
      input.type = 'time'; input.step = 900; input.required = true;
      input.name = `${key}-time-${i}`; input.value = h[key];
      input.setAttribute('aria-label', `${key === 'open' ? 'Apertura' : 'Cierre'} ${['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'][i]}`);
      row.append(input);
    });
    return row;
  }));
}

$('#settings-form').onsubmit = e => {
  e.preventDefault();
  const form = new FormData(e.target);
  const business = form.get('business');
  const hours = Array.from({ length: 7 }, (_, i) => ({
    closed: !form.has(`open-${i}`),
    open: form.get(`open-time-${i}`),
    close: form.get(`close-time-${i}`)
  }));
  action(async () => {
    saveLocalBusiness(business);
    saveLocalHours(hours);
    config.business = business;
    if (window.CloudDB && window.CloudDB.isReady()) {
      await window.CloudDB.saveSettings({ business, hours });
    }
    if (!isOffline) {
      try { await api('admin/settings', { business, hours }, 'PATCH'); } catch {}
    }
    await load(); toast('Horario y negocio actualizados.');
  });
};

// ── Pestaña Nube y Sincronización (Firebase) ───────────────────────────────────

function parseFirebaseConfigInput(text) {
  text = text.trim();
  // Caso 1: el usuario pegó el código JS completo: const firebaseConfig = { ... };
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    text = match[0];
  }
  // Convertir formato JS relajado a JSON si hace falta
  try {
    return JSON.parse(text);
  } catch (err) {
    // Evaluar objeto seguro mediante Function
    try {
      const fn = new Function('return ' + text);
      const res = fn();
      if (res && typeof res === 'object') return res;
    } catch (e2) {}
  }
  throw new Error('No se pudo interpretar el formato. Pega el objeto { apiKey: "...", projectId: "..." }');
}

function renderCloudTab() {
  const isCloud = window.CloudDB && window.CloudDB.isReady();
  const input = $('#cloud-config-input');
  if (input && !input.value.trim()) {
    try {
      const saved = localStorage.getItem('nexocita_firebase_config');
      if (saved) {
        input.value = JSON.stringify(JSON.parse(saved), null, 2);
      } else if (window.NEXOCITA_FIREBASE_CONFIG && window.NEXOCITA_FIREBASE_CONFIG.apiKey) {
        input.value = JSON.stringify(window.NEXOCITA_FIREBASE_CONFIG, null, 2);
      }
    } catch {}
  }
}

const cloudForm = $('#cloud-config-form');
if (cloudForm) {
  cloudForm.onsubmit = async e => {
    e.preventDefault();
    $('#cloud-error').textContent = '';
    const btn = $('#save-cloud-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Probando conexión…';

    try {
      const rawText = $('#cloud-config-input').value;
      if (!rawText.trim()) throw new Error('Pega la configuración de Firebase primero.');
      const parsed = parseFirebaseConfigInput(rawText);
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('La configuración debe contener al menos apiKey y projectId.');
      }

      // Probar conexión real con Firestore
      await window.CloudDB.testConnection(parsed);

      // Guardar en este navegador/dispositivo
      localStorage.setItem('nexocita_firebase_config', JSON.stringify(parsed));
      window.NEXOCITA_FIREBASE_CONFIG = parsed;

      // Inicializar CloudDB
      window.CloudDB.init();

      toast('🟢 ¡Conectado a Firebase con éxito!');
      await load();
      $('#cloud-error').textContent = '';
    } catch (err) {
      $('#cloud-error').textContent = 'Error: ' + (err.message || 'No se pudo conectar a Firebase.');
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 Conectar y Probar Nube';
    }
  };
}

const migrateBtn = $('#migrate-cloud-btn');
if (migrateBtn) {
  migrateBtn.onclick = async () => {
    if (!window.CloudDB || !window.CloudDB.isReady()) {
      toast('Conecta Firebase primero antes de migrar.');
      return;
    }
    migrateBtn.disabled = true;
    migrateBtn.textContent = '⏳ Subiendo datos a la nube…';
    try {
      const localApps = JSON.parse(localStorage.getItem('nexocita_appointments') || '[]');
      const count = await window.CloudDB.migrateLocalData(
        localApps,
        getLocalServices(),
        { business: getLocalBusiness(), hours: getLocalHours() }
      );
      toast(`🚀 ¡${count} cita(s) subidas a la nube con éxito!`);
      await load();
    } catch (err) {
      $('#cloud-error').textContent = 'Error migrando: ' + err.message;
    } finally {
      migrateBtn.disabled = false;
      migrateBtn.textContent = '🚀 Subir citas de esta PC a la Nube';
    }
  };
}

const statusBadge = $('#cloud-status-badge');
if (statusBadge) {
  statusBadge.onclick = () => selectView('cloud');
}

// ── Navegación de vistas ──────────────────────────────────────────────────────

const viewTabs = $$('.panel-tabs button');
function selectView(view) {
  viewTabs.forEach(b => {
    const selected = b.dataset.view === view;
    b.setAttribute('aria-selected', String(selected));
    b.tabIndex = selected ? 0 : -1;
    $('#view-' + b.dataset.view).hidden = !selected;
  });
}
viewTabs.forEach((b, i) => {
  b.onclick = () => selectView(b.dataset.view);
  b.onkeydown = e => {
    let j;
    if (e.key === 'ArrowRight') j = (i + 1) % viewTabs.length;
    if (e.key === 'ArrowLeft') j = (i + viewTabs.length - 1) % viewTabs.length;
    if (j !== undefined) { e.preventDefault(); viewTabs[j].focus(); selectView(viewTabs[j].dataset.view); }
  };
});

// ── Autenticación ─────────────────────────────────────────────────────────────

$('#auth-form').onsubmit = async e => {
  e.preventDefault();
  $('#auth-error').textContent = '';
  $('#auth-submit').disabled = true;
  const values = Object.fromEntries(new FormData(e.target));

  if (isOffline) {
    sessionStorage.setItem('nexocita_admin_auth', 'true');
    e.target.reset();
    await load();
    $('#auth-submit').disabled = false;
    return;
  }

  try {
    if (!config) config = await api('config');
    await api(config.setup_required ? 'setup' : 'login', values);
    config.setup_required = false;
    e.target.reset();
    await load();
  } catch (error) {
    if (error.message === 'offline') {
      isOffline = true;
      sessionStorage.setItem('nexocita_admin_auth', 'true');
      e.target.reset();
      await load();
    } else {
      $('#auth-error').textContent = error.message;
    }
  } finally {
    $('#auth-submit').disabled = false;
  }
};

$('#logout').onclick = () => action(async () => {
  if (isOffline) {
    sessionStorage.removeItem('nexocita_admin_auth');
    location.reload();
    return;
  }
  try { await api('logout', {}); } catch {}
  location.reload();
});

$('#refresh').onclick = () => action(async () => {
  if (!isOffline) {
    try { config = await api('config'); } catch { isOffline = true; }
  }
  await load();
  toast('Agenda actualizada.');
});

// ── Inicialización ────────────────────────────────────────────────────────────

$('#global-error').textContent = '';

action(async () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const maxDateStr = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
  config = {
    business: getLocalBusiness(),
    today: todayStr,
    max_date: maxDateStr,
    setup_required: false,
    authenticated: sessionStorage.getItem('nexocita_admin_auth') === 'true'
  };

  try {
    const serverCfg = await api('config');
    config = serverCfg;
    isOffline = false;
  } catch {
    isOffline = true;
    $('#global-error').textContent = '';
  }

  selectedDate = config.today;
  month = selectedDate.slice(0, 7);

  if (config.setup_required) {
    $('#auth-title').textContent = 'Configura tu negocio.';
    $('#auth-description').textContent = 'Elige el nombre y una contraseña de al menos 10 caracteres. Después podrás ajustar los servicios y el horario antes de recibir reservas.';
    $('#business-label').hidden = false;
    $('#auth-submit').textContent = 'Crear acceso al negocio';
    $('#auth-form input[type=password]').autocomplete = 'new-password';
  }

  if (config.authenticated) {
    await load();
  }
});
})();
