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
  return raw.map(x => x.appointment).filter(Boolean);
}

function buildLocalClients(appointments) {
  const map = new Map();
  appointments.forEach(a => {
    const key = (a.phone || '').replace(/\D/g, '') || a.name;
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

// ── Carga de datos (CloudDB Supabase > Servidor SQLite > LocalStorage) ────────

function updateCloudBadges() {
  const isCloud = window.CloudDB && window.CloudDB.isReady();
  const badge = $('#cloud-status-badge');
  const detailBadge = $('#cloud-detail-badge');
  if (badge) {
    badge.textContent = isCloud ? '🟢 Supabase Activo' : '🟡 Modo Local';
    badge.title = isCloud ? 'Sincronizado en tiempo real con Supabase (PostgreSQL)' : 'Sin conexión a Supabase. Haz clic para configurar tu servidor.';
    badge.style.background = isCloud ? '#e6f4ea' : '#fef7e0';
    badge.style.color = isCloud ? '#137333' : '#b06000';
  }
  if (detailBadge) {
    detailBadge.textContent = isCloud ? '🟢 Conectado a Supabase' : '🟡 Sin conectar';
    detailBadge.style.background = isCloud ? '#e6f4ea' : '#fef7e0';
    detailBadge.style.color = isCloud ? '#137333' : '#b06000';
  }
}

async function load() {
  data = null;
  updateCloudBadges();

  // 1. Prioridad: CloudDB Firebase (sincroniza todos los dispositivos en tiempo real)
  if (window.CloudDB && window.CloudDB.isReady()) {
    try {
      const [cloudApps, cloudSvcs, cloudSettings] = await Promise.all([
        window.CloudDB.getAppointments(),
        window.CloudDB.getServices(),
        window.CloudDB.getSettings()
      ]);

      if (!Array.isArray(cloudApps)) throw new Error('La agenda compartida no respondió.');
      const apps = cloudApps.map(x => x.appointment).filter(Boolean);

      data = {
        business: cloudSettings?.business || 'NEXOCITA',
        appointments: apps,
        clients: buildLocalClients(apps),
        services: Array.isArray(cloudSvcs) ? cloudSvcs : DEFAULT_SERVICES,
        hours: cloudSettings?.hours || DEFAULT_HOURS
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
      $('#global-error').textContent = err.message;
      const badge = $('#cloud-status-badge');
      if (badge) badge.textContent = 'Sin sincronización';
      $('#dashboard').hidden = true;
      throw err;
    }
  }

  // 2. Si no hay CloudDB o no devolvió datos, intentar servidor API o local
  if (!data || !data.appointments) {
    if (isOffline) {
      throw new Error('No hay conexión con la agenda compartida. Los registros locales no son la agenda del negocio.');
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
    function deleteAppointmentAdmin(targetApp) {
      if (confirm(`¿Eliminar la cita #${targetApp.id} de ${targetApp.name} (${format(targetApp.date)} a las ${targetApp.time})?\nEsta acción es permanente y liberará el horario.`)) {
        action(async () => {
          let deleted = false;
          let lastErr = null;
          if (window.CloudDB && window.CloudDB.isReady()) {
            try {
              await window.CloudDB.deleteAppointment(targetApp.id);
              deleted = true;
            } catch (e) {
              lastErr = e;
            }
          }
          if (!deleted && !isOffline) {
            try {
              await api('admin/appointment', { id: targetApp.id }, 'DELETE');
              deleted = true;
            } catch (e) {
              lastErr = e;
            }
          }
          const raw = JSON.parse(localStorage.getItem('nexocita_appointments') || '[]');
          localStorage.setItem('nexocita_appointments', JSON.stringify(raw.filter(x => !(x.appointment && x.appointment.id === targetApp.id))));

          if (!deleted && isOffline) deleted = true;
          if (!deleted && lastErr) throw lastErr;
          await load();
          toast('Cita eliminada de la agenda.');
        });
      }
    }

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
        }, 'danger-button'),
        button('Eliminar', () => deleteAppointmentAdmin(a), 'danger-button')
      );
    } else {
      actions.append(
        button('Eliminar', () => deleteAppointmentAdmin(a), 'danger-button')
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
            const apps = data.appointments.filter(a => (a.phone || '').replace(/\D/g,'') === (c.phone || '').replace(/\D/g,''));
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
      }),
      button('Eliminar cliente', () => {
        if (confirm(`¿Eliminar a ${c.name} y TODAS sus citas?\nEsta acción es permanente e irreversible.`)) {
          if (confirm(`Confirmación final: ¿borrar a ${c.name} (${c.phone}) junto con sus ${c.visits} cita(s)?`)) {
            action(async () => {
              if (window.CloudDB && window.CloudDB.isReady()) {
                await window.CloudDB.deleteClient(c.phone);
                const raw = JSON.parse(localStorage.getItem('nexocita_appointments') || '[]');
                const phone = (c.phone || '').replace(/\D/g, '');
                localStorage.setItem('nexocita_appointments', JSON.stringify(
                  raw.filter(x => (x.appointment?.phone || '').replace(/\D/g, '') !== phone)
                ));
                await load(); toast('Cliente y sus citas eliminados de la nube.'); return;
              }
              if (isOffline) {
                const raw = JSON.parse(localStorage.getItem('nexocita_appointments') || '[]');
                localStorage.setItem('nexocita_appointments', JSON.stringify(
                  raw.filter(x => x.appointment?.phone !== c.phone)
                ));
                await load(); toast('Cliente eliminado.'); return;
              }
              await api('admin/client', { id: c.id }, 'DELETE');
              await load(); toast('Cliente y sus citas eliminados.');
            });
          }
        }
      }, 'danger-button')
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

// ── Pestaña Servidor y Sincronización (Supabase) ─────────────────────────────

const SUPABASE_SQL_SCHEMA = 'La base de datos ya está configurada y protegida. No ejecutes esquemas de acceso público.';

function renderCloudTab() {
  updateCloudBadges();
  const urlInput = $('#supabase-url-input');
  const keyInput = $('#supabase-key-input');
  const jsonInput = $('#cloud-config-input');

  let cfg = null;
  try {
    const saved = localStorage.getItem('nexocita_supabase_config');
    if (saved) cfg = JSON.parse(saved);
    else if (window.NEXOCITA_SUPABASE_CONFIG?.url) cfg = window.NEXOCITA_SUPABASE_CONFIG;
  } catch (e) {}

  if (cfg) {
    if (urlInput && !urlInput.value) urlInput.value = cfg.url || '';
    if (keyInput && !keyInput.value) keyInput.value = cfg.anonKey || cfg.anon_key || '';
    if (jsonInput && !jsonInput.value.trim()) {
      jsonInput.value = JSON.stringify({ url: cfg.url || '', anonKey: cfg.anonKey || cfg.anon_key || '' }, null, 2);
    }
  }
}

const cloudForm = $('#cloud-config-form');
if (cloudForm) {
  cloudForm.onsubmit = async e => {
    e.preventDefault();
    $('#cloud-error').textContent = '';
    const btn = $('#save-cloud-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Probando conexión con Supabase…';

    try {
      const urlVal = $('#supabase-url-input')?.value.trim() || '';
      const keyVal = $('#supabase-key-input')?.value.trim() || '';
      const rawText = $('#cloud-config-input')?.value.trim() || '';

      let targetCfg = null;
      if (urlVal && keyVal) {
        targetCfg = { url: urlVal, anonKey: keyVal };
      } else if (rawText) {
        targetCfg = parseSupabaseConfigInput(rawText);
      }

      if (!targetCfg || !targetCfg.url || !targetCfg.anonKey) {
        throw new Error('Debes completar tanto la URL del Proyecto Supabase como la Clave Anónima (anon key).');
      }

      // Probar conexión real con Supabase
      await window.CloudDB.testConnection(targetCfg);

      // Guardar en este navegador/dispositivo
      localStorage.setItem('nexocita_supabase_config', JSON.stringify(targetCfg));
      window.NEXOCITA_SUPABASE_CONFIG = targetCfg;

      // Inicializar CloudDB
      window.CloudDB.init(targetCfg);

      toast('🟢 ¡Conectado al servidor Supabase con éxito!');
      await load();
      $('#cloud-error').textContent = '';
    } catch (err) {
      $('#cloud-error').textContent = 'Error: ' + (err.message || 'No se pudo conectar a Supabase.');
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 Conectar y Probar Supabase';
    }
  };
}

const migrateBtn = $('#migrate-cloud-btn');
if (migrateBtn) {
  migrateBtn.onclick = async () => {
    if (!window.CloudDB || !window.CloudDB.isReady()) {
      toast('Conecta el servidor Supabase primero antes de migrar.');
      return;
    }
    migrateBtn.disabled = true;
    migrateBtn.textContent = '⏳ Subiendo datos a Supabase…';
    try {
      const localApps = JSON.parse(localStorage.getItem('nexocita_appointments') || '[]');
      const count = await window.CloudDB.migrateLocalData(
        localApps,
        getLocalServices(),
        { business: getLocalBusiness(), hours: getLocalHours() }
      );
      toast(`🚀 ¡${count} cita(s) subidas a Supabase con éxito!`);
      await load();
    } catch (err) {
      $('#cloud-error').textContent = 'Error migrando: ' + err.message;
    } finally {
      migrateBtn.disabled = false;
      migrateBtn.textContent = '🚀 Subir citas de esta PC a Supabase';
    }
  };
}

// Control del diálogo modal de Esquema SQL
const sqlDialog = $('#sql-dialog');
const viewSqlBtn = $('#view-sql-btn');
const closeSqlBtn = $('#close-sql-btn');
const closeSqlX = $('#close-sql-dialog-x');
const copySqlBtn = $('#copy-sql-btn');
const sqlBox = $('#sql-content-box');

if (viewSqlBtn && sqlDialog) {
  viewSqlBtn.onclick = () => {
    if (sqlBox) sqlBox.value = SUPABASE_SQL_SCHEMA;
    sqlDialog.showModal();
  };
}
if (closeSqlBtn && sqlDialog) closeSqlBtn.onclick = () => sqlDialog.close();
if (closeSqlX && sqlDialog) closeSqlX.onclick = () => sqlDialog.close();
if (copySqlBtn && sqlBox) {
  copySqlBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
      toast('📋 ¡Esquema SQL copiado al portapapeles!');
    } catch {
      sqlBox.select();
      document.execCommand('copy');
      toast('📋 ¡Esquema SQL copiado!');
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

  if (window.CloudDB?.isReady()) {
    try {
      await window.CloudDB.signIn(values.email, values.password);
      e.target.reset(); await load();
    } catch(error) { $('#auth-error').textContent = error.message; }
    finally { $('#auth-submit').disabled = false; }
    return;
  }
  if (isOffline) {
    $('#auth-error').textContent = 'No hay conexión con el servidor.';
    $('#auth-submit').disabled = false; return;
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
      $('#auth-error').textContent = 'No hay conexión con el servidor.';
    } else {
      $('#auth-error').textContent = error.message;
    }
  } finally {
    $('#auth-submit').disabled = false;
  }
};

$('#logout').onclick = () => action(async () => {
  if (window.CloudDB?.isReady()) { await window.CloudDB.signOut(); location.reload(); return; }
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

let refreshing = false;
async function refreshSharedAppointments() {
  if (!data || document.hidden || !window.CloudDB?.isReady() || refreshing) return;
  refreshing = true;
  try {
    const rows = await window.CloudDB.getAppointments();
    data.appointments = rows.map(x => x.appointment);
    data.clients = buildLocalClients(data.appointments);
    renderMetrics(); renderCalendar(); renderAppointments(); renderClients();
    $('#global-error').textContent = '';
    $('#cloud-status-badge').textContent = 'Agenda sincronizada';
  } catch (error) {
    $('#global-error').textContent = 'No se pudo actualizar la agenda: ' + error.message;
    $('#cloud-status-badge').textContent = 'Sin sincronización';
  } finally { refreshing = false; }
}
setInterval(refreshSharedAppointments, 15000);
window.addEventListener('focus', refreshSharedAppointments);

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
    authenticated: false
  };

  if (window.CloudDB?.isReady()) {
    isOffline = true;
    $('#admin-email-label').hidden = false;
    $('#admin-email').required = true;
    selectedDate = config.today; month = selectedDate.slice(0,7);
    if (await window.CloudDB.isAdmin()) await load();
    return;
  }
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
