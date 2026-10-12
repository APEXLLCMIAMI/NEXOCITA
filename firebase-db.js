// ─── Capa de Sincronización en la Nube con Firebase Firestore ─────────────────
// Conecta clientes públicos, teléfonos y computadoras a una misma base de datos 24/7.

const CloudDB = (() => {
  let app = null;
  let db = null;
  let isReady = false;
  let unsubscribeAppointments = null;

  function init() {
    if (typeof firebase === 'undefined') return false;
    let cfg = window.NEXOCITA_FIREBASE_CONFIG;
    if (!cfg || !cfg.apiKey || !cfg.projectId) {
      try {
        const stored = localStorage.getItem('nexocita_firebase_config');
        if (stored) cfg = JSON.parse(stored);
      } catch (e) {}
    }

    if (!cfg || !cfg.apiKey || !cfg.projectId) {
      isReady = false;
      return false;
    }

    try {
      if (!firebase.apps.length) {
        app = firebase.initializeApp(cfg);
      } else {
        app = firebase.app();
      }
      db = firebase.firestore();
      isReady = true;
      return true;
    } catch (err) {
      console.warn('Error inicializando Firebase:', err);
      isReady = false;
      return false;
    }
  }

  // Inicializar al cargar
  init();

  return {
    init,
    isReady: () => isReady,

    async testConnection(testConfig) {
      if (typeof firebase === 'undefined') {
        throw new Error('La librería Firebase no está cargada.');
      }
      try {
        let tempApp;
        const appName = 'testApp_' + Date.now();
        tempApp = firebase.initializeApp(testConfig, appName);
        const tempDb = tempApp.firestore();
        // Probar lectura de una colección
        await tempDb.collection('settings').doc('business').get();
        // Limpiar app temporal
        await tempApp.delete();
        return true;
      } catch (err) {
        throw new Error(err.message || 'No se pudo conectar a Firebase.');
      }
    },

    // ── Citas ──
    async getAppointments() {
      if (!isReady && !init()) return null;
      try {
        const snap = await db.collection('appointments').get();
        const list = [];
        snap.forEach(doc => {
          list.push({ appointment: doc.data(), token: doc.data().token || '' });
        });
        return list;
      } catch (err) {
        console.error('Error al obtener citas de Firebase:', err);
        return null;
      }
    },

    async getAppointmentsByDate(date) {
      if (!isReady && !init()) return null;
      try {
        const snap = await db.collection('appointments')
          .where('date', '==', date)
          .where('status', '==', 'confirmed')
          .get();
        const list = [];
        snap.forEach(doc => list.push(doc.data()));
        return list;
      } catch (err) {
        console.warn('Error al consultar disponibilidad en Firebase:', err);
        return null;
      }
    },

    async saveAppointment(appointment, token) {
      if (!isReady && !init()) return false;
      try {
        const data = { ...appointment, token, updated_at: firebase.firestore.FieldValue.serverTimestamp() };
        await db.collection('appointments').doc(appointment.id).set(data);
        return true;
      } catch (err) {
        console.error('Error al guardar cita en Firebase:', err);
        throw err;
      }
    },

    async updateAppointment(id, updates) {
      if (!isReady && !init()) return false;
      try {
        await db.collection('appointments').doc(id).update({
          ...updates,
          updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
      } catch (err) {
        console.error('Error al actualizar cita en Firebase:', err);
        throw err;
      }
    },

    async lookupAppointment(id, token) {
      if (!isReady && !init()) return null;
      try {
        const doc = await db.collection('appointments').doc(id).get();
        if (!doc.exists) return null;
        const data = doc.data();
        if (data.token && data.token !== token) {
          throw new Error('Clave de consulta incorrecta.');
        }
        return data;
      } catch (err) {
        throw err;
      }
    },

    // ── Escucha en tiempo real para el Panel ──
    onAppointmentsChange(callback) {
      if (!isReady && !init()) return null;
      try {
        if (unsubscribeAppointments) unsubscribeAppointments();
        unsubscribeAppointments = db.collection('appointments').onSnapshot(snap => {
          const list = [];
          snap.forEach(doc => {
            list.push({ appointment: doc.data(), token: doc.data().token || '' });
          });
          callback(list);
        }, err => {
          console.warn('Error en listener de citas:', err);
        });
        return unsubscribeAppointments;
      } catch (err) {
        console.warn('No se pudo suscribir a citas:', err);
        return null;
      }
    },

    // ── Servicios ──
    async getServices() {
      if (!isReady && !init()) return null;
      try {
        const snap = await db.collection('services').get();
        if (snap.empty) return null;
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        return list;
      } catch (err) {
        return null;
      }
    },

    async saveServices(services) {
      if (!isReady && !init()) return false;
      try {
        const batch = db.batch();
        for (const s of services) {
          const ref = db.collection('services').doc(String(s.id));
          batch.set(ref, s);
        }
        await batch.commit();
        return true;
      } catch (err) {
        return false;
      }
    },

    // ── Horarios y Negocio ──
    async getSettings() {
      if (!isReady && !init()) return null;
      try {
        const doc = await db.collection('settings').doc('business').get();
        return doc.exists ? doc.data() : null;
      } catch (err) {
        return null;
      }
    },

    async saveSettings(settings) {
      if (!isReady && !init()) return false;
      try {
        await db.collection('settings').doc('business').set(settings, { merge: true });
        return true;
      } catch (err) {
        return false;
      }
    },

    // ── Migración de datos locales a la Nube ──
    async migrateLocalData(localAppointments, services, settings) {
      if (!isReady && !init()) throw new Error('Firebase no está conectado.');
      let count = 0;
      const batch = db.batch();

      if (localAppointments && localAppointments.length) {
        for (const item of localAppointments) {
          if (item && item.appointment && item.appointment.id) {
            const ref = db.collection('appointments').doc(item.appointment.id);
            batch.set(ref, {
              ...item.appointment,
              token: item.token || 'seed',
              synced_at: new Date().toISOString()
            }, { merge: true });
            count++;
          }
        }
      }

      if (services && services.length) {
        for (const s of services) {
          const ref = db.collection('services').doc(String(s.id));
          batch.set(ref, s, { merge: true });
        }
      }

      if (settings) {
        const ref = db.collection('settings').doc('business');
        batch.set(ref, settings, { merge: true });
      }

      await batch.commit();
      return count;
    }
  };
})();

if (typeof window !== 'undefined') {
  window.CloudDB = CloudDB;
}
