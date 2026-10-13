// ─── Capa de Sincronización en la Nube con Supabase (PostgreSQL + Realtime) ───
// Conecta clientes públicos, teléfonos móviles y computadoras a una misma
// base de datos en Supabase 24/7 sin depender de que la PC esté encendida.

const CloudDB = (() => {
  let client = null;
  let isReady = false;
  let realtimeChannel = null;

  function getActiveConfig() {
    let cfg = window.NEXOCITA_SUPABASE_CONFIG;
    if (!cfg || !cfg.url || !cfg.anonKey) {
      try {
        const stored = localStorage.getItem('nexocita_supabase_config');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.url && parsed.anonKey) cfg = parsed;
        }
      } catch (e) {}
    }
    return cfg;
  }

  function init(overrideCfg) {
    if (typeof window === 'undefined' || typeof window.supabase === 'undefined') {
      isReady = false;
      return false;
    }

    let cfg = overrideCfg || getActiveConfig();

    if (!cfg || !cfg.url || !cfg.anonKey) {
      console.info('ℹ️ NEXOCITA: Supabase aún no tiene URL y anonKey configuradas en supabase-config.js. La app está funcionando en modo local (aislado por dispositivo).');
      isReady = false;
      return false;
    }

    try {
      const cleanUrl = cfg.url.trim().replace(/\/$/, '');
      const cleanKey = cfg.anonKey.trim();
      client = window.supabase.createClient(cleanUrl, cleanKey, {
        auth: { persistSession: false }
      });
      isReady = true;
      return true;
    } catch (err) {
      console.warn('Error inicializando cliente Supabase:', err);
      isReady = false;
      return false;
    }
  }

  // Inicializar al cargar el script si la librería está disponible
  init();

  return {
    init,
    isReady: () => isReady && !!client,
    getClient: () => client,

    // Probar conexión real con Supabase
    async testConnection(testConfig) {
      if (typeof window === 'undefined' || typeof window.supabase === 'undefined') {
        throw new Error('La librería Supabase (@supabase/supabase-js) no está cargada.');
      }
      if (!testConfig || !testConfig.url || !testConfig.anonKey) {
        throw new Error('Debes proporcionar tanto la URL del proyecto como la Clave Anónima (anon key).');
      }

      try {
        const cleanUrl = testConfig.url.trim().replace(/\/$/, '');
        const cleanKey = testConfig.anonKey.trim();
        const testClient = window.supabase.createClient(cleanUrl, cleanKey, {
          auth: { persistSession: false }
        });

      // Intentar leer la tabla appointments (siempre existe en NEXOCITA)
        const { error } = await testClient.from('appointments').select('id').limit(1);
        if (error) {
          if (error.code === '42P01') {
            throw new Error('Conexión con Supabase exitosa, pero la tabla appointments no existe. Ejecuta el archivo supabase_schema.sql en el SQL Editor de Supabase.');
          }
          throw new Error(error.message || 'Error al conectar con Supabase.');
        }
        return true;
      } catch (err) {
        throw new Error(err.message || 'No se pudo conectar al servidor Supabase.');
      }
    },

    // ── Citas ──
    async getAppointments() {
      if (!isReady && !init()) return null;
      try {
        const { data, error } = await client
          .from('appointments')
          .select('*')
          .order('date', { ascending: true })
          .order('time', { ascending: true });

        if (error) throw error;
        return (data || []).map(row => ({
          appointment: {
            id: row.id,
            name: row.name,
            phone: row.phone,
            email: row.email || '',
            service_id: row.service_id,
            service_name: row.service_name,
            duration: row.duration,
            date: row.date,
            time: row.time,
            notes: row.notes || '',
            status: row.status,
            created: row.created_at || row.created
          },
          token: row.token || ''
        }));
      } catch (err) {
        console.error('Error al obtener citas de Supabase:', err);
        return null;
      }
    },

    async getAppointmentsByDate(date) {
      if (!isReady && !init()) return null;
      try {
        const { data, error } = await client
          .from('appointments')
          .select('*')
          .eq('date', date)
          .eq('status', 'confirmed');

        if (error) throw error;
        return (data || []).map(row => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          email: row.email || '',
          service_name: row.service_name,
          duration: row.duration,
          date: row.date,
          time: row.time,
          notes: row.notes || '',
          status: row.status
        }));
      } catch (err) {
        console.warn('Error al consultar disponibilidad en Supabase:', err);
        return null;
      }
    },

    async saveAppointment(appointment, token) {
      if (!isReady && !init()) return false;
      try {
        const row = {
          id: appointment.id,
          name: appointment.name,
          phone: appointment.phone,
          email: appointment.email || '',
          service_id: String(appointment.service_id || '1'),
          service_name: appointment.service_name,
          duration: Number(appointment.duration) || 30,
          date: appointment.date,
          time: appointment.time,
          notes: appointment.notes || '',
          status: appointment.status || 'confirmed',
          token: token,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await client.from('appointments').insert([row]);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error('Error al guardar cita en Supabase:', err);
        throw err;
      }
    },

    async updateAppointment(id, updates) {
      if (!isReady && !init()) return false;
      try {
        const payload = {
          ...updates,
          updated_at: new Date().toISOString()
        };
        const { error } = await client.from('appointments').update(payload).eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error('Error al actualizar cita en Supabase:', err);
        throw err;
      }
    },

    async lookupAppointment(id, token) {
      if (!isReady && !init()) return null;
      try {
        const { data, error } = await client
          .from('appointments')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!data) return null;
        if (data.token && data.token !== token) {
          throw new Error('Clave de consulta incorrecta.');
        }
        return {
          id: data.id,
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          service_name: data.service_name,
          duration: data.duration,
          date: data.date,
          time: data.time,
          notes: data.notes || '',
          status: data.status,
          created: data.created_at || data.created
        };
      } catch (err) {
        throw err;
      }
    },

    // ── Escucha en tiempo real para el Panel de Administración ──
    onAppointmentsChange(callback) {
      if (!isReady && !init()) return null;
      try {
        if (realtimeChannel) {
          try { client.removeChannel(realtimeChannel); } catch (e) {}
        }

        realtimeChannel = client.channel('nexocita-appointments-' + Date.now())
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'appointments' },
            async (payload) => {
              console.log('⚡ Actualización en tiempo real desde Supabase:', payload);
              const list = await this.getAppointments();
              if (list && typeof callback === 'function') {
                callback(list);
              }
            }
          )
          .subscribe();

        return realtimeChannel;
      } catch (err) {
        console.warn('No se pudo suscribir a eventos de Supabase Realtime:', err);
        return null;
      }
    },

    // ── Servicios ──
    async getServices() {
      if (!isReady && !init()) return null;
      try {
        const { data, error } = await client
          .from('services')
          .select('*')
          .order('id');

        if (error || !data || !data.length) return null;
        return data.map(s => ({
          id: s.id,
          name: s.name,
          duration: Number(s.duration),
          active: s.active !== false
        }));
      } catch (err) {
        return null;
      }
    },

    async saveServices(services) {
      if (!isReady && !init()) return false;
      try {
        const rows = services.map(s => ({
          id: String(s.id),
          name: s.name,
          duration: Number(s.duration),
          active: s.active !== false
        }));
        const { error } = await client.from('services').upsert(rows, { onConflict: 'id' });
        if (error) throw error;
        return true;
      } catch (err) {
        console.error('Error al guardar servicios en Supabase:', err);
        return false;
      }
    },

    // ── Horarios y Negocio ──
    async getSettings() {
      if (!isReady && !init()) return null;
      try {
        const { data, error } = await client.from('settings').select('*');
        if (error || !data) return null;
        const res = {};
        for (const item of data) {
          let val = item.value;
          if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch (e) {}
          }
          if (item.key === 'business') {
            res.business = typeof val === 'object' && val.name ? val.name : val;
          } else {
            res[item.key] = val;
          }
        }
        return res;
      } catch (err) {
        return null;
      }
    },

    async saveSettings(settings) {
      if (!isReady && !init()) return false;
      try {
        const rows = [];
        if (settings.business !== undefined) {
          rows.push({
            key: 'business',
            value: typeof settings.business === 'object' ? settings.business : { name: settings.business }
          });
        }
        if (settings.hours !== undefined) {
          rows.push({
            key: 'hours',
            value: settings.hours
          });
        }

        if (rows.length) {
          const { error } = await client.from('settings').upsert(rows, { onConflict: 'key' });
          if (error) throw error;
        }
        return true;
      } catch (err) {
        console.error('Error al guardar configuración en Supabase:', err);
        return false;
      }
    },

    // ── Migración de datos locales a Supabase ──
    async migrateLocalData(localAppointments, services, settings) {
      if (!isReady && !init()) throw new Error('Supabase no está conectado.');
      let count = 0;

      if (localAppointments && localAppointments.length) {
        const appRows = localAppointments.map(item => {
          const a = item.appointment || {};
          return {
            id: a.id,
            name: a.name || 'Cliente',
            phone: a.phone || '',
            email: a.email || '',
            service_id: String(a.service_id || '1'),
            service_name: a.service_name || 'Servicio',
            duration: Number(a.duration) || 30,
            date: a.date,
            time: a.time,
            notes: a.notes || '',
            status: a.status || 'confirmed',
            token: item.token || 'seed',
            created_at: a.created || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }).filter(r => !!r.id);

        if (appRows.length) {
          const { error } = await client.from('appointments').upsert(appRows, { onConflict: 'id' });
          if (error) throw error;
          count = appRows.length;
        }
      }

      if (services && services.length) {
        await this.saveServices(services);
      }

      if (settings) {
        await this.saveSettings(settings);
      }

      return count;
    }
  };
})();

if (typeof window !== 'undefined') {
  window.CloudDB = CloudDB;
}
