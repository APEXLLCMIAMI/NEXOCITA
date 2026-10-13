// ─── Configuración de Conexión del Servidor (Supabase / API) ───────────────────
// 1. Conexión recomendada 24/7 en la nube: Supabase (PostgreSQL + Realtime).
//    Configura tus credenciales en 'supabase-config.js' o desde la pestaña "⚡ Servidor Supabase" en panel.html.
// 2. Conexión alternativa: Servidor Python local o Railway.
//    Si estás en GitHub Pages u otro hosting estático y usas el servidor Python,
//    define window.NEXOCITA_API_URL:
//      window.NEXOCITA_API_URL = 'https://tu-app.up.railway.app';
const API_BASE = (typeof window !== 'undefined' && window.NEXOCITA_API_URL)
  ? window.NEXOCITA_API_URL.replace(/\/$/, '')
  : '';
