// NEXOCITA: una agenda compartida. RLS protege los datos de los clientes.
const CloudDB = (() => {
  let client;
  function init() {
    const cfg = window.NEXOCITA_SUPABASE_CONFIG;
    if (!window.supabase || !cfg?.url || !cfg?.anonKey) return false;
    if (!client) client = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'nexocita-admin-session' }
    });
    return true;
  }
  function ready() { if (!client && !init()) throw Error('No hay conexión configurada con la agenda.'); }
  async function result(query) { const { data, error } = await query; if (error) throw Error(error.message); return data; }
  async function rpc(name,args) { ready(); return result(client.rpc(name,args)); }
  const wrap = row => ({ appointment: {...row, created:row.created_at}, token:row.token || '' });
  const db = {
    init, isReady:()=>!!client, getClient:()=>client,
    async signIn(email,password) {
      ready(); await result(client.auth.signInWithPassword({email,password}));
      if (!await db.isAdmin()) { await client.auth.signOut(); throw Error('Esta cuenta no administra NEXOCITA.'); }
    },
    async signOut() { ready(); await client.auth.signOut(); },
    async isAdmin() {
      ready(); const {data:{session}}=await client.auth.getSession();
      if (!session) return false;
      const rows=await result(client.from('nexocita_admins').select('user_id').eq('user_id',session.user.id));
      return rows.length===1;
    },
    async testConnection() { await db.getServices(); return true; },
    async getAppointments() {
      ready(); if (!await db.isAdmin()) throw Error('Inicia sesión con tu cuenta administradora.');
      let rows=[],offset=0;
      while(true) {
        const page=await result(client.from('appointments').select('*').order('date').order('time').order('id').range(offset,offset+499));
        rows.push(...page); if(page.length<500) break; offset+=500;
      }
      return rows.map(wrap);
    },
    async getSlots(date,service) { return rpc('nexocita_slots',{p_date:date,p_service:String(service)}); },
    async saveAppointment(appointment,token) {
      const row=await rpc('nexocita_book',{p_booking:appointment,p_token:token});
      if (!row?.id) throw Error('El servidor no confirmó la reserva.');
      Object.assign(appointment,row); return true;
    },
    async lookupAppointment(id,token) { return rpc('nexocita_lookup',{p_id:id,p_token:token}); },
    async cancelAppointment(id,token) { return rpc('nexocita_cancel',{p_id:id,p_token:token}); },
    async updateAppointment(id,updates) {
      ready(); const rows=await result(client.from('appointments').update({...updates,updated_at:new Date().toISOString()}).eq('id',id).select('id'));
      if(rows.length!==1) throw Error('No se guardó el cambio. Comprueba tu sesión.'); return true;
    },
    async deleteAppointment(id) {
      ready(); await result(client.from('appointments').delete().eq('id',id)); return true;
    },
    async deleteClient(phone) {
      ready();
      const clean = (phone||'').replace(/\D/g,'');
      await result(client.from('appointments').delete().like('phone', `%${clean}%`));
      await result(client.from('appointments').delete().eq('phone', phone));
      return true;
    },
    onAppointmentsChange() {}, // El panel consulta cada 15 segundos, incluso sin Realtime.
    async getServices() { ready(); return result(client.from('services').select('*').order('id')); },
    async saveServices(services) {
      ready(); await result(client.from('services').upsert(services.map(s=>({id:String(s.id),name:s.name,duration:Number(s.duration),active:!!s.active})),{onConflict:'id'})); return true;
    },
    async getSettings() {
      ready(); const rows=await result(client.from('settings').select('*')); const settings={};
      for (const row of rows) settings[row.key]=row.key==='business' ? row.value.name : row.value;
      return settings;
    },
    async saveSettings(settings) {
      ready(); const rows=[];
      if(settings.business!==undefined) rows.push({key:'business',value:{name:settings.business}});
      if(settings.hours!==undefined) rows.push({key:'hours',value:settings.hours});
      if(rows.length) await result(client.from('settings').upsert(rows,{onConflict:'key'})); return true;
    },
    async migrateLocalData(items) {
      ready(); if(!await db.isAdmin()) throw Error('Inicia sesión para recuperar registros locales.');
      const rows=items.filter(x=>x.appointment?.id && x.token && !/^seed/.test(x.token)).map(({appointment:a,token})=>({
        id:a.id,name:a.name,phone:a.phone,email:a.email||'',service_id:String(a.service_id||'1'),service_name:a.service_name,
        duration:Number(a.duration)||30,date:a.date,time:a.time,notes:a.notes||'',status:a.status||'confirmed',token,
        created_at:a.created_at||a.created||new Date().toISOString(),updated_at:new Date().toISOString()
      }));
      if(!rows.length) return 0;
      const saved=await result(client.from('appointments').upsert(rows,{onConflict:'id',ignoreDuplicates:true}).select('id'));
      return saved.length;
    }
  };
  init(); return db;
})();
window.CloudDB=CloudDB;
